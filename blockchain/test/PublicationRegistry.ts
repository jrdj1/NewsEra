import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { PublicationRegistry } from "../typechain-types";

describe("PublicationRegistry", function () {
  let registry: PublicationRegistry;
  let owner: Awaited<ReturnType<typeof ethers.getSigner>>;
  let alice: Awaited<ReturnType<typeof ethers.getSigner>>;

  const HASH_A = ethers.keccak256(ethers.toUtf8Bytes("Cuerpo del artículo A"));
  const HASH_B = ethers.keccak256(ethers.toUtf8Bytes("Cuerpo del artículo B"));

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PublicationRegistry");
    registry = await Factory.deploy();
  });

  // ── registerPublication ────────────────────────────────────────────────────

  describe("registerPublication", function () {
    it("registra una publicación nueva sin revertir", async function () {
      await expect(registry.registerPublication(HASH_A)).not.to.be.reverted;
    });

    it("emite PublicationRegistered con los argumentos correctos", async function () {
      await expect(registry.registerPublication(HASH_A))
        .to.emit(registry, "PublicationRegistered")
        .withArgs(HASH_A, owner.address, anyValue);
    });

    it("revierte con PublicationAlreadyExists en hash duplicado", async function () {
      await registry.registerPublication(HASH_A);
      await expect(registry.registerPublication(HASH_A))
        .to.be.revertedWithCustomError(registry, "PublicationAlreadyExists")
        .withArgs(HASH_A);
    });

    it("permite que distintos autores registren hashes distintos", async function () {
      await registry.registerPublication(HASH_A);
      await expect(
        registry.connect(alice).registerPublication(HASH_B)
      ).not.to.be.reverted;
    });
  });

  // ── getPublication ─────────────────────────────────────────────────────────

  describe("getPublication", function () {
    it("devuelve author y exists correctos tras el registro", async function () {
      await registry.registerPublication(HASH_A);
      const pub = await registry.getPublication(HASH_A);

      expect(pub.author).to.equal(owner.address);
      expect(pub.exists).to.be.true;
      expect(pub.timestamp).to.be.greaterThan(0n);
    });

    it("el author almacenado es msg.sender, no el deployer", async function () {
      await registry.connect(alice).registerPublication(HASH_A);
      const pub = await registry.getPublication(HASH_A);
      expect(pub.author).to.equal(alice.address);
    });

    it("revierte con PublicationNotFound para un hash inexistente", async function () {
      await expect(registry.getPublication(HASH_A))
        .to.be.revertedWithCustomError(registry, "PublicationNotFound")
        .withArgs(HASH_A);
    });

    it("revierte con PublicationNotFound para un hash distinto al registrado", async function () {
      await registry.registerPublication(HASH_A);
      await expect(registry.getPublication(HASH_B))
        .to.be.revertedWithCustomError(registry, "PublicationNotFound")
        .withArgs(HASH_B);
    });
  });
});
