import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ReputationSystem, ValidationRegistry } from "../typechain-types";

// ── Parámetros del contrato ────────────────────────────────────────────────
const QUORUM           = 3n;
const SUPER_MAJORITY   = 6667n; // 66.67% — 3/3 = DEFINITIVE, 2/3 = DISPUTED
const REOPEN_THRESHOLD = 3n;
const INIT_REP         = 10n;
const REWARD           = 5n;
const PENALTY          = 3n;
const RETRO_DELTA      = 1n;

// ConsensusState indices
const PENDING    = 0n;
const DEFINITIVE = 1n;
const DISPUTED   = 2n;

// VoteType
const TRUE_VOTE         = 0;
const FALSE_VOTE        = 1;
const UNVERIFIABLE_VOTE = 2;

const h = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
const HASH  = h("articulo-multironda");
const HASH2 = h("otro-articulo");

// ── Helpers ────────────────────────────────────────────────────────────────

async function deployRegistry(
  rep: ReputationSystem,
  quorum: bigint,
  superMaj: bigint,
  reopenThresh: bigint,
): Promise<ValidationRegistry> {
  const F = await ethers.getContractFactory("ValidationRegistry");
  const reg = await F.deploy(await rep.getAddress(), quorum, superMaj, reopenThresh);
  await reg.waitForDeployment();
  const VALIDATOR_ROLE = await rep.VALIDATOR_ROLE();
  await rep.grantRole(VALIDATOR_ROLE, await reg.getAddress());
  return reg;
}

/** Hace que todos los voters emitan el mismo tipo de voto */
async function doVotes(
  reg: ValidationRegistry,
  hash: string,
  voters: HardhatEthersSigner[],
  vote: number,
): Promise<void> {
  for (const v of voters) {
    await reg.connect(v).submitValidation(hash, vote);
  }
}

/** Hace que los requesters soliciten reapertura */
async function doReopen(
  reg: ValidationRegistry,
  hash: string,
  requesters: HardhatEthersSigner[],
): Promise<void> {
  for (const r of requesters) {
    await reg.connect(r).requestReopen(hash);
  }
}

// ── Suite principal ────────────────────────────────────────────────────────

describe("ValidationRegistry", () => {
  let reputation: ReputationSystem;
  let registry:   ValidationRegistry;
  let admin:      HardhatEthersSigner;
  // 15 validadores: v[0..14]. Suficientes para 4 rondas + tests de cap.
  let v:          HardhatEthersSigner[];

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    admin = signers[0];
    v     = signers.slice(1, 16); // v[0]..v[14]

    const RepF = await ethers.getContractFactory("ReputationSystem");
    reputation = await RepF.deploy();
    await reputation.waitForDeployment();

    registry = await deployRegistry(reputation, QUORUM, SUPER_MAJORITY, REOPEN_THRESHOLD);

    // Registrar los 15 validadores con reputación inicial 10
    for (const val of v) {
      await reputation.registerValidator(val.address, INIT_REP);
    }
  });

  // ── submitValidation ─────────────────────────────────────────────────────

  describe("submitValidation", () => {
    it("registra el voto y emite ValidationSubmitted con round=0", async () => {
      await expect(registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE))
        .to.emit(registry, "ValidationSubmitted")
        .withArgs(HASH, v[0].address, TRUE_VOTE, 0);

      expect(await registry.roundVoteCount(HASH, 0)).to.equal(1n);
    });

    it("revierte AlreadyValidated si el mismo validador vota dos veces", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await expect(registry.connect(v[0]).submitValidation(HASH, FALSE_VOTE))
        .to.be.revertedWithCustomError(registry, "AlreadyValidated")
        .withArgs(HASH, v[0].address);
    });

    it("revierte InsufficientReputation si canValidate es false", async () => {
      await expect(registry.connect(admin).submitValidation(HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "InsufficientReputation")
        .withArgs(admin.address);
    });

    it("revierte VotingNotOpen cuando el estado no es PENDING", async () => {
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE); // → DEFINITIVE
      await expect(registry.connect(v[3]).submitValidation(HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "VotingNotOpen")
        .withArgs(HASH);
    });

    it("hashes distintos son independientes", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await expect(registry.connect(v[0]).submitValidation(HASH2, FALSE_VOTE))
        .to.emit(registry, "ValidationSubmitted");
    });
  });

  // ── PENDING ───────────────────────────────────────────────────────────────

  describe("PENDING", () => {
    it("con menos votos que el quorum, el estado es PENDING", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(HASH, TRUE_VOTE);
      expect(await registry.consensusState(HASH)).to.equal(PENDING);
    });

    it("se puede seguir votando mientras el estado es PENDING", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await expect(registry.connect(v[1]).submitValidation(HASH, FALSE_VOTE))
        .to.emit(registry, "ValidationSubmitted");
    });
  });

  // ── DEFINITIVE ────────────────────────────────────────────────────────────

  describe("DEFINITIVE — supermayoría alcanzada", () => {
    it("3/3 TRUE → DEFINITIVE, todos +REWARD, evento con round=0", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(HASH, TRUE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(HASH, TRUE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(HASH, TRUE_VOTE, DEFINITIVE, 0);

      expect(await registry.consensusState(HASH)).to.equal(DEFINITIVE);
      const ri = await registry.rounds(HASH, 0);
      expect(ri.state).to.equal(DEFINITIVE);
      expect(ri.completed).to.be.true;

      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP + REWARD);
    });

    it("4 TRUE + 1 FALSE de 5 (80%) → DEFINITIVE; FALSE voter −PENALTY", async () => {
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY, REOPEN_THRESHOLD);
      await doVotes(reg5, HASH, [v[0], v[1], v[2], v[3]], TRUE_VOTE);
      await reg5.connect(v[4]).submitValidation(HASH, FALSE_VOTE);

      expect(await reg5.consensusState(HASH)).to.equal(DEFINITIVE);
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });

    it("4 TRUE + 1 UNVERIFIABLE → DEFINITIVE; UNVERIFIABLE voter −PENALTY", async () => {
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY, REOPEN_THRESHOLD);
      await doVotes(reg5, HASH, [v[0], v[1], v[2], v[3]], TRUE_VOTE);
      await reg5.connect(v[4]).submitValidation(HASH, UNVERIFIABLE_VOTE);

      expect(await reg5.consensusState(HASH)).to.equal(DEFINITIVE);
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });

    it("3/3 UNVERIFIABLE → DEFINITIVE result=UNVERIFIABLE, todos +REWARD", async () => {
      await doVotes(registry, HASH, [v[0], v[1], v[2]], UNVERIFIABLE_VOTE);
      expect(await registry.consensusState(HASH)).to.equal(DEFINITIVE);
      const ri = await registry.rounds(HASH, 0);
      expect(ri.result).to.equal(UNVERIFIABLE_VOTE);
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
    });

    it("4 UNVERIFIABLE + 1 TRUE → DEFINITIVE result=UNVERIFIABLE; TRUE voter −PENALTY", async () => {
      const reg5 = await deployRegistry(reputation, 5n, SUPER_MAJORITY, REOPEN_THRESHOLD);
      await doVotes(reg5, HASH, [v[0], v[1], v[2], v[3]], UNVERIFIABLE_VOTE);
      await reg5.connect(v[4]).submitValidation(HASH, TRUE_VOTE);

      expect(await reg5.consensusState(HASH)).to.equal(DEFINITIVE);
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP + REWARD);
      expect(await reputation.getReputation(v[4].address)).to.equal(INIT_REP - PENALTY);
    });
  });

  // ── DISPUTED ──────────────────────────────────────────────────────────────

  describe("DISPUTED — quórum sin supermayoría", () => {
    it("2 TRUE + 1 FALSE (66.6% < 66.67%) → DISPUTED, sin cambio de reputación", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(HASH, TRUE_VOTE);
      await expect(registry.connect(v[2]).submitValidation(HASH, FALSE_VOTE))
        .to.emit(registry, "ConsensusReached")
        .withArgs(HASH, TRUE_VOTE, DISPUTED, 0);

      expect(await registry.consensusState(HASH)).to.equal(DISPUTED);
      expect(await reputation.getReputation(v[0].address)).to.equal(INIT_REP);
      expect(await reputation.getReputation(v[1].address)).to.equal(INIT_REP);
      expect(await reputation.getReputation(v[2].address)).to.equal(INIT_REP);
    });

    it("2 TRUE + 2 FALSE de 4 (50%) → DISPUTED", async () => {
      const reg4 = await deployRegistry(reputation, 4n, SUPER_MAJORITY, REOPEN_THRESHOLD);
      await doVotes(reg4, HASH, [v[0], v[1]], TRUE_VOTE);
      await doVotes(reg4, HASH, [v[2], v[3]], FALSE_VOTE);
      expect(await reg4.consensusState(HASH)).to.equal(DISPUTED);
    });

    it("1 TRUE + 1 FALSE + 1 UNVERIFIABLE (33.3%) → DISPUTED", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(HASH, FALSE_VOTE);
      await registry.connect(v[2]).submitValidation(HASH, UNVERIFIABLE_VOTE);
      expect(await registry.consensusState(HASH)).to.equal(DISPUTED);
    });

    it("VotingNotOpen después de DISPUTED", async () => {
      await doVotes(registry, HASH, [v[0], v[1]], TRUE_VOTE);
      await registry.connect(v[2]).submitValidation(HASH, FALSE_VOTE); // → DISPUTED
      await expect(registry.connect(v[3]).submitValidation(HASH, TRUE_VOTE))
        .to.be.revertedWithCustomError(registry, "VotingNotOpen");
    });
  });

  // ── requestReopen ─────────────────────────────────────────────────────────

  describe("requestReopen", () => {
    beforeEach(async () => {
      // Ronda 0 → DISPUTED para que esté disponible reopen
      await doVotes(registry, HASH, [v[0], v[1]], TRUE_VOTE);
      await registry.connect(v[2]).submitValidation(HASH, FALSE_VOTE);
    });

    it("revierte ReopenNotAvailable si el estado es PENDING", async () => {
      await expect(registry.connect(v[3]).requestReopen(HASH2))
        .to.be.revertedWithCustomError(registry, "ReopenNotAvailable")
        .withArgs(HASH2);
    });

    it("revierte AlreadyValidated si el solicitante ya votó en ese artículo", async () => {
      await expect(registry.connect(v[0]).requestReopen(HASH))
        .to.be.revertedWithCustomError(registry, "AlreadyValidated")
        .withArgs(HASH, v[0].address);
    });

    it("revierte InsufficientReputation si el solicitante no puede validar", async () => {
      await expect(registry.connect(admin).requestReopen(HASH))
        .to.be.revertedWithCustomError(registry, "InsufficientReputation")
        .withArgs(admin.address);
    });

    it("revierte AlreadyRequestedReopen si el mismo validador solicita dos veces", async () => {
      await registry.connect(v[3]).requestReopen(HASH);
      await expect(registry.connect(v[3]).requestReopen(HASH))
        .to.be.revertedWithCustomError(registry, "AlreadyRequestedReopen")
        .withArgs(HASH, v[3].address);
    });

    it("acumula solicitudes y emite ReopenRequested", async () => {
      await expect(registry.connect(v[3]).requestReopen(HASH))
        .to.emit(registry, "ReopenRequested")
        .withArgs(HASH, v[3].address, 1);
      expect(await registry.reopenRequestCount(HASH)).to.equal(1n);

      await expect(registry.connect(v[4]).requestReopen(HASH))
        .to.emit(registry, "ReopenRequested")
        .withArgs(HASH, v[4].address, 2);
    });

    it("al llegar a reopenThreshold abre nueva ronda: PENDING, round++, count reset", async () => {
      await registry.connect(v[3]).requestReopen(HASH);
      await registry.connect(v[4]).requestReopen(HASH);
      await expect(registry.connect(v[5]).requestReopen(HASH))
        .to.emit(registry, "VotingReopened")
        .withArgs(HASH, 1);

      expect(await registry.consensusState(HASH)).to.equal(PENDING);
      expect(await registry.currentRound(HASH)).to.equal(1n);
      expect(await registry.reopenRequestCount(HASH)).to.equal(0n);
    });

    it("nueva ronda acepta votos de los solicitantes", async () => {
      await doReopen(registry, HASH, [v[3], v[4], v[5]]);
      expect(await registry.consensusState(HASH)).to.equal(PENDING);

      await expect(registry.connect(v[3]).submitValidation(HASH, TRUE_VOTE))
        .to.emit(registry, "ValidationSubmitted")
        .withArgs(HASH, v[3].address, TRUE_VOTE, 1);
    });
  });

  // ── Sistema multironda — integración E2E ──────────────────────────────────

  describe("multironda", () => {
    it("ronda 0 DEFINITIVE TRUE → reopen → ronda 1 DEFINITIVE FALSE: rondas independientes", async () => {
      // Ronda 0: v[0], v[1], v[2] votan TRUE → DEFINITIVE TRUE
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      expect(await registry.consensusState(HASH)).to.equal(DEFINITIVE);
      expect((await registry.rounds(HASH, 0)).result).to.equal(TRUE_VOTE);

      // Reopen: v[3], v[4], v[5] solicitan → ronda 1
      await doReopen(registry, HASH, [v[3], v[4], v[5]]);
      expect(await registry.currentRound(HASH)).to.equal(1n);

      // Ronda 1: v[3], v[4], v[5] votan FALSE → DEFINITIVE FALSE
      await doVotes(registry, HASH, [v[3], v[4], v[5]], FALSE_VOTE);
      expect(await registry.consensusState(HASH)).to.equal(DEFINITIVE);
      expect((await registry.rounds(HASH, 1)).result).to.equal(FALSE_VOTE);

      // Ronda 0 sigue registrada correctamente
      expect((await registry.rounds(HASH, 0)).result).to.equal(TRUE_VOTE);
      expect(await registry.voterRound(HASH, v[0].address)).to.equal(0n);
      expect(await registry.voterRound(HASH, v[3].address)).to.equal(1n);
    });
  });

  // ── claimRetroactiveReputation ────────────────────────────────────────────

  describe("claimRetroactiveReputation", () => {
    it("NothingToClaim si el validador nunca ha votado", async () => {
      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.be.revertedWithCustomError(registry, "NothingToClaim")
        .withArgs(HASH, v[0].address);
    });

    it("NothingToClaim si no hay rondas DEFINITIVE posteriores al voto del validador", async () => {
      // Ronda 0 cierra en DEFINITIVE; v[0] intentará reclamar pero no hay rondas posteriores
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      // currentRound sigue en 0, startRound sería 1 > 0 = latestRound
      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.be.revertedWithCustomError(registry, "NothingToClaim")
        .withArgs(HASH, v[0].address);
    });

    it("+1 por ronda confirmatoria (wasCorrect=true, ronda posterior confirma)", async () => {
      // Ronda 0: v[0] TRUE, v[1] TRUE, v[2] TRUE → DEFINITIVE TRUE (v[0] wasCorrect)
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      const repAfterRound0 = await reputation.getReputation(v[0].address); // 10 + 5 = 15

      // Reopen por v[3], v[4], v[5]
      await doReopen(registry, HASH, [v[3], v[4], v[5]]);

      // Ronda 1: v[3], v[4], v[5] TRUE → DEFINITIVE TRUE (confirma ronda 0)
      await doVotes(registry, HASH, [v[3], v[4], v[5]], TRUE_VOTE);

      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.emit(registry, "RetroactiveClaimed")
        .withArgs(HASH, v[0].address, 1n);

      expect(await reputation.getReputation(v[0].address)).to.equal(repAfterRound0 + RETRO_DELTA);
    });

    it("-1 por ronda contradictoria (wasCorrect=true, ronda posterior contradice)", async () => {
      // Ronda 0: v[0] TRUE (wasCorrect)
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      const repAfterRound0 = await reputation.getReputation(v[0].address); // 15

      // Reopen + Ronda 1 FALSE (contradice ronda 0)
      await doReopen(registry, HASH, [v[3], v[4], v[5]]);
      await doVotes(registry, HASH, [v[3], v[4], v[5]], FALSE_VOTE);

      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.emit(registry, "RetroactiveClaimed")
        .withArgs(HASH, v[0].address, -1n);

      expect(await reputation.getReputation(v[0].address)).to.equal(repAfterRound0 - RETRO_DELTA);
    });

    it("cap +3: 4 rondas confirmatorias → solo se aplican 3 ajustes", async () => {
      // Ronda 0: v[0] TRUE (wasCorrect)
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      const repAfterRound0 = await reputation.getReputation(v[0].address); // 15

      // 4 rondas posteriores confirmatorias (TRUE), cada una requiere 3 nuevos validadores
      const sets = [
        [v[3],  v[4],  v[5]],
        [v[6],  v[7],  v[8]],
        [v[9],  v[10], v[11]],
        [v[12], v[13], v[14]],
      ];
      for (const set of sets) {
        await doReopen(registry, HASH, set);
        await doVotes(registry, HASH, set, TRUE_VOTE);
      }
      // currentRound = 4, hay 4 rondas confirmatorias (1-4)

      // Solo se aplican 3 ajustes (RETROACTIVE_CAP=3)
      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.emit(registry, "RetroactiveClaimed")
        .withArgs(HASH, v[0].address, 3n);

      expect(await reputation.getReputation(v[0].address)).to.equal(repAfterRound0 + 3n);
    });

    it("segunda reclamación procesa solo las rondas nuevas, no las ya contabilizadas", async () => {
      // Ronda 0: v[0] TRUE (wasCorrect)
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);

      // Ronda 1 confirmatoria
      await doReopen(registry, HASH, [v[3], v[4], v[5]]);
      await doVotes(registry, HASH, [v[3], v[4], v[5]], TRUE_VOTE);

      // Primera reclamación: procesa ronda 1 → +1
      await registry.connect(v[0]).claimRetroactiveReputation(HASH);
      const repAfterFirst = await reputation.getReputation(v[0].address);

      // Ronda 2 confirmatoria (nueva)
      await doReopen(registry, HASH, [v[6], v[7], v[8]]);
      await doVotes(registry, HASH, [v[6], v[7], v[8]], TRUE_VOTE);

      // Segunda reclamación: _retroLastRound=1, latestRound=2 → loop de r=1 a r=2
      // Ronda 1 se re-procesa (posUsed 1→2, +1) + ronda 2 nueva (posUsed 2→3, +1) → net=+2
      await expect(registry.connect(v[0]).claimRetroactiveReputation(HASH))
        .to.emit(registry, "RetroactiveClaimed")
        .withArgs(HASH, v[0].address, 2n);

      expect(await reputation.getReputation(v[0].address)).to.equal(repAfterFirst + 2n);
    });
  });

  // ── View helpers ──────────────────────────────────────────────────────────

  describe("view helpers", () => {
    it("getVote devuelve el tipo de voto y la ronda del validador", async () => {
      await doVotes(registry, HASH, [v[0], v[1], v[2]], TRUE_VOTE);
      const [vote, round] = await registry.getVote(HASH, v[0].address);
      expect(vote).to.equal(TRUE_VOTE);
      expect(round).to.equal(0n);
    });

    it("getRoundVoters devuelve los votantes de una ronda", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      await registry.connect(v[1]).submitValidation(HASH, FALSE_VOTE);
      const voters = await registry.getRoundVoters(HASH, 0);
      expect(voters).to.have.lengthOf(2);
      expect(voters[0]).to.equal(v[0].address);
      expect(voters[1]).to.equal(v[1].address);
    });

    it("hasVoted devuelve true tras votar y false para quien no ha votado", async () => {
      await registry.connect(v[0]).submitValidation(HASH, TRUE_VOTE);
      expect(await registry.hasVoted(HASH, v[0].address)).to.be.true;
      expect(await registry.hasVoted(HASH, v[1].address)).to.be.false;
    });
  });
});
