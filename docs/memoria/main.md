Plataforma descentralizada
para la validación y difusión
de información veraz
mediante tecnología
blockchain

Grado en Ingeniería Informática

Trabajo Fin de Grado

Autor:
Jorge Rafael de Julián Vicedo

Tutor:
Dr. Higinio Mora Mora

Julio 2026

EscuelaPolitécnicaSuperiorPlataforma descentralizada para la
validación y difusión de información veraz
mediante tecnología blockchain

NewsEra

Autor
Jorge Rafael de Julián Vicedo

Tutor
Dr. Higinio Mora Mora
Tecnología Informática y Computación

Grado en Ingeniería Informática

ALICANTE, Julio 2026

EscuelaPolitécnicaSuperiorA mi familia, a mis amigos, a María, a Fito y a Yrsa.
Gracias por estar siempre.

Agradecimientos

Quiero expresar mi más sincero agradecimiento al Dr. Higinio Mora Mora, mi tutor, por

su orientación, su paciencia y por guiarme con criterio en cada etapa de este trabajo.

A mi familia, por el apoyo incondicional de siempre y por confiar en mí incluso cuando yo

dudaba.

A mis amigos y a María, por estar ahí en los momentos difíciles y en los buenos también,

que hacen que todo tenga más sentido.
Y a Fito y a Yrsa, con todo el cariño.

v

Acceso abierto

Se  autoriza  a  la  Universidad  de  Alicante  a  depositar  este  Trabajo  Fin  de  Grado  en  el
Repositorio Institucional de la UA (RUA) y a difundirlo en acceso abierto, de conformidad
con la normativa vigente sobre propiedad intelectual y el mandato de acceso abierto de la
institución.

vii

Resumen

El  ecosistema  informativo  contemporáneo  está  sometido  a  una  captura  estructural  por
parte  de  grupos  con  intereses  particulares.  Los  medios  de  comunicación  —tanto  públicos
como privados— subordinan su línea editorial a sus propietarios, anunciantes y fuentes gu-
bernamentales, mientras que los algoritmos de las grandes plataformas digitales amplifican o
suprimen contenidos sin transparencia ni rendición de cuentas democrática. El ciudadano or-
dinario carece de infraestructura técnica para verificar de forma autónoma la autenticidad, la
autoría y el historial de modificación de cualquier pieza informativa. Las soluciones existentes
—agencias de fact-checking, moderación algorítmica— no resuelven el problema estructural:
son ellas mismas entidades centralizadas con sus propias dependencias y sus propios marcos
interpretativos.

Este  TFG  propone  NewsEra,  una  plataforma  descentralizada  para  la  validación  y  difu-
sión  de  información  veraz  mediante  tecnología  blockchain.  La  premisa  del  sistema  es  que
la resistencia estructural frente a la captura se logra codificando las reglas de publicación,
verificación y gobernanza en contratos inteligentes desplegados en una blockchain pública,
donde ningún actor puede modificarlas unilateralmente. El sistema articula tres mecanismos
complementarios: publicación abierta e inmutable, en la que cualquier ciudadano registra con-
tenido asociado a un hash criptográfico que garantiza su integridad; validación comunitaria
con responsabilidad pública, mediante la que validadores acreditados emiten juicios de vera-
cidad que quedan permanentemente registrados en cadena; y un mecanismo de reputación y
gobernanza distribuida —componente central del trabajo— que determina qué participantes
pueden validar y con qué peso, calculando esa reputación a partir del historial verificable de
cada usuario sin interferencia de actores externos.

La implementación sigue una metodología ágil Scrum adaptada a un proyecto individual,
organizada en nueve sprints de dos semanas. El stack tecnológico se estructura en tres ca-
pas: la capa blockchain utiliza Solidity, Hardhat, OpenZeppelin y la red de prueba Ethereum
Sepolia; la capa de backend emplea Node.js, TypeScript, Hono, Prisma ORM y PostgreSQL;
el almacenamiento descentralizado del contenido de los artículos se realiza mediante IPFS
a  través  de  Pinata;  y  la  interfaz  de  usuario  se  construye  con  React,  Vite,  Tailwind  CSS,
shadcn/ui, wagmi v2, viem y RainbowKit. De forma complementaria, el trabajo contempla
la integración opcional de herramientas de inteligencia artificial para el análisis automáti-
co de contenido —detección de duplicados, identificación de sesgos y análisis de imágenes
manipuladas— como apoyo al criterio humano de los validadores.

Palabras clave: blockchain, desinformación, gobernanza distribuida, contratos inteligen-

tes, reputación descentralizada, verificación de contenidos, Web3

ix

Abstract

The  contemporary  information  ecosystem  is  subject  to  structural  capture  by  groups  with
particular interests.  Both public and private media outlets subordinate their editorial lines
to their owners, advertisers and government sources, while the algorithms of major digital
platforms  amplify  or  suppress  content  without  transparency  or  democratic  accountability.
Ordinary citizens lack the technical infrastructure to autonomously verify the authenticity,
authorship and modification history of any piece of information.  Existing solutions —fact-
checking agencies, algorithmic moderation— fail to address this structural problem: they are
themselves centralised entities with their own funding dependencies and interpretive frame-
works.

This bachelor’s thesis proposes NewsEra, a decentralised platform for the validation and
dissemination of truthful information using blockchain technology.  The system’s premise is
that  structural  resistance  to  capture  is  achieved  by  encoding  the  rules  governing  publica-
tion, verification and governance in smart contracts deployed on a public blockchain, where
no single actor can unilaterally modify them.  The system articulates three complementary
mechanisms:  open and immutable publication, whereby any citizen registers content asso-
ciated with a cryptographic hash that guarantees its integrity;  community validation with
public  accountability,  through  which  accredited  validators  issue  veracity  judgements  that
are permanently recorded on-chain; and a distributed reputation and governance mechanism
—the core component of the work— that determines which participants may validate and
with  what  weight,  computing  that  reputation  from  each  user’s  verifiable  on-chain  history
without external interference.

The implementation follows an agile Scrum methodology adapted to an individual project,
organised into nine two-week sprints.  The technology stack is structured in three layers:  the
blockchain layer uses Solidity, Hardhat, OpenZeppelin and the Ethereum Sepolia test net-
work; the backend layer employs Node.js, TypeScript, Hono, Prisma ORM and PostgreSQL;
article content is stored in a decentralised manner using IPFS via Pinata; and the user inter-
face is built with React, Vite, Tailwind CSS, shadcn/ui, wagmi v2, viem and RainbowKit. As
a complementary feature, the work explores the optional integration of artificial intelligence
tools for automated content analysis —duplicate detection, linguistic bias identification and
manipulated image analysis— as support for the human judgement of validators.

Keywords:  blockchain, disinformation, distributed governance, smart contracts, decen-

tralised reputation, content verification, Web3

xi

Índice general

Agradecimientos

Acceso abierto

Resumen

Abstract

1. Introducción

1.1. Motivación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.2. Planteamiento del problema . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.3. Propuesta y enfoque . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.4. Objetivo general
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.5. Objetivos específicos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.6. Metodología . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
1.7. Estructura del documento . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

2. Marco Teórico

2.1.
Información, poder y democracia . . . . . . . . . . . . . . . . . . . . . . . . .
2.2. Tecnología Blockchain . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
2.2.1. Fundamentos criptográficos y estructura de datos . . . . . . . . . . . .
2.2.2. Bitcoin: el libro mayor distribuido . . . . . . . . . . . . . . . . . . . .
2.2.3. Ethereum y los contratos inteligentes . . . . . . . . . . . . . . . . . . .
2.2.4. Tipos de redes blockchain . . . . . . . . . . . . . . . . . . . . . . . . .
2.3. Contratos inteligentes y Solidity . . . . . . . . . . . . . . . . . . . . . . . . . .
2.3.1. Concepto y propiedades . . . . . . . . . . . . . . . . . . . . . . . . . .
2.3.2. Solidity: lenguaje de programación . . . . . . . . . . . . . . . . . . . .
2.4. Gobernanza distribuida y sistemas de reputación . . . . . . . . . . . . . . . .
2.4.1. Organizaciones Autónomas Descentralizadas (DAOs) . . . . . . . . . .
2.4.2. Mecanismos de votación . . . . . . . . . . . . . . . . . . . . . . . . . .
2.4.3. Sistemas de reputación en redes distribuidas . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . .
2.4.4. Mecanismos de incentivo y teoría de juegos
2.5.
Identidad descentralizada . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
2.6. Almacenamiento descentralizado: IPFS . . . . . . . . . . . . . . . . . . . . . .
Inteligencia Artificial para el análisis de contenido (opcional)
. . . . . . . . .
2.7.
2.7.1. Detección de desinformación mediante NLP . . . . . . . . . . . . . . .
2.7.2. Detección de contenido multimedia manipulado . . . . . . . . . . . . .
2.7.3. Detección de duplicados y sesgos . . . . . . . . . . . . . . . . . . . . .
2.8. Síntesis: bases tecnológicas de NewsEra . . . . . . . . . . . . . . . . . . . . .

v

vii

ix

xi

1
1
2
2
3
3
5
5

7
7
8
8
8
9
9
9
9
10
10
10
11
11
12
12
12
13
13
14
14
14

xiii

Índice general

xiv

3. Metodología

3.1. Enfoque metodológico general . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.2. Scrum adaptado al proyecto individual . . . . . . . . . . . . . . . . . . . . . .
3.2.1. Adaptación de roles
. . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.2.2. Adaptación de ceremonias . . . . . . . . . . . . . . . . . . . . . . . . .
3.2.3. Artefactos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.3. Planificación en fases y sprints
. . . . . . . . . . . . . . . . . . . . . . . . . .
3.4. Principios de desarrollo . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.5. Stack tecnológico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.5.1. Capa blockchain: red y framework de desarrollo . . . . . . . . . . . . .
3.5.2. Capa de backend . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.5.3. Capa de frontend . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.5.4. Herramientas de desarrollo y control de versiones . . . . . . . . . . . .
3.6. Estrategia de validación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
3.6.1. Pruebas unitarias de contratos inteligentes . . . . . . . . . . . . . . . .
3.6.2. Pruebas de escenario del mecanismo de gobernanza . . . . . . . . . . .
3.6.3. Análisis de coste de gas
. . . . . . . . . . . . . . . . . . . . . . . . . .
3.6.4. Evaluación de viabilidad del sistema . . . . . . . . . . . . . . . . . . .
3.6.5. Experimentos de validación con usuarios . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

3.7. Gestión de riesgos

4. Diseño del sistema

4.1. Especificación de requisitos

. . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.1.1. Casos de uso . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.1.1.1. FEAT 1. Gestión de cuenta . . . . . . . . . . . . . . . . . . .
4.1.1.2. FEAT 2. Publicar artículo . . . . . . . . . . . . . . . . . . .
4.1.1.3. FEAT 3. Explorar contenido . . . . . . . . . . . . . . . . . .
4.1.1.4. FEAT 4. Verificar artículo . . . . . . . . . . . . . . . . . . .
4.1.1.5. FEAT 5. Información institucional . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . .
4.1.2. Casos de uso detallados
. . . . . . . . . . . . . . . . . . . . . . . . .
4.1.3. Requisitos no funcionales
4.1.4. Requisitos de datos . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . . .
4.1.5. Requisitos de interfaz
4.2. Visión general de la arquitectura . . . . . . . . . . . . . . . . . . . . . . . . .
4.2.1. Capa on-chain: la fuente de verdad . . . . . . . . . . . . . . . . . . . .
4.2.2. Capa off-chain: eficiencia y consultabilidad . . . . . . . . . . . . . . .
4.2.3. Capa de presentación: la interfaz Web3 . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . .
4.2.4. El hash criptográfico como vínculo entre capas
4.2.5. Esquema global del sistema . . . . . . . . . . . . . . . . . . . . . . . .
4.2.6. Distribución de datos entre capas . . . . . . . . . . . . . . . . . . . . .
4.3. Diseño de los contratos inteligentes . . . . . . . . . . . . . . . . . . . . . . . .
4.3.1. PublicationRegistry . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.3.2. ValidationRegistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.3.3. ReputationSystem . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . .
4.3.4. Tabla de funciones principales de los contratos

17
17
17
17
18
18
18
20
21
21
22
22
23
23
24
24
24
24
25
26

29
29
29
29
30
31
31
32
32
32
34
36
37
37
37
38
38
40
40
42
42
43
48
49

Índice general

4.4. Modelo de datos

. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.4.1. Almacenamiento on-chain . . . . . . . . . . . . . . . . . . . . . . . . .
4.4.2. Esquema off-chain (PostgreSQL / Prisma) . . . . . . . . . . . . . . . .
4.4.3. Sincronización on-chain → off-chain . . . . . . . . . . . . . . . . . . .
4.5. Diseño de la API REST . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.5.1. Arquitectura de capas del backend . . . . . . . . . . . . . . . . . . . .
4.5.2. Endpoints de la API . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.6. Diseño de la interfaz de usuario . . . . . . . . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.6.1.
4.6.2. Estructura de la aplicación React . . . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . .
4.6.3. Flujos de interacción principales
4.7. Flujo de publicación y validación . . . . . . . . . . . . . . . . . . . . . . . . .

Identidad visual

5. Resultados

5.1. Resumen del prototipo implementado . . . . . . . . . . . . . . . . . . . . . .
5.2. Resultados de los contratos inteligentes . . . . . . . . . . . . . . . . . . . . . .
5.2.1. Despliegue en Sepolia . . . . . . . . . . . . . . . . . . . . . . . . . . .
5.2.2. Análisis de coste de gas
. . . . . . . . . . . . . . . . . . . . . . . . . .
5.2.3. Cobertura de tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
5.3. Métricas de implementación . . . . . . . . . . . . . . . . . . . . . . . . . . . .
5.4. Evaluación del cumplimiento de objetivos
. . . . . . . . . . . . . . . . . . . .
5.5. Consideraciones de diseño: evolución del sistema . . . . . . . . . . . . . . . .
5.5.1. De abstención a veredicto: el tipo UNVERIFIABLE . . . . . . . . . .
5.5.2. De única ronda a sistema multironda con reapertura . . . . . . . . . .
5.5.3. De penalización simple a reputación retroactiva . . . . . . . . . . . . .
5.5.4. De voto ponderado a voto plano con acceso gated . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
5.6.1. Viabilidad técnica del mecanismo de reputación . . . . . . . . . . . . .
5.6.2. Limitaciones observadas durante la implementación . . . . . . . . . . .

5.6. Discusión de resultados

6. Conclusiones

6.1. Conclusiones principales . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
6.2. Contribuciones del trabajo . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
6.3. Limitaciones . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
6.4. Trabajo futuro . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
6.5. Valoración personal . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

Bibliografía

Lista de Acrónimos y Abreviaturas

Glosario de Términos

A. Catálogo de casos de uso detallados

A.1. FEAT 1. Gestión de cuenta . . . . . . . . . . . . . . . . . . . . . . . . . . . .
A.2. FEAT 2. Publicar artículo . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

xv

51
51
52
54
55
55
55
57
57
59
59
60

63
63
63
63
64
64
64
65
66
66
66
67
67
68
68
69

71
71
73
74
75
78

79

83

85

89
89
93

xvi

Índice general

A.3. FEAT 3. Explorar contenido . . . . . . . . . . . . . . . . . . . . . . . . . . . .
A.4. FEAT 4. Verificar artículo . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
A.5. FEAT 5. Información institucional

96
99
. . . . . . . . . . . . . . . . . . . . . . . . 103

B. Instrumentos de los experimentos de validación

105
B.1. Bloque A — Experimento 1: intensidad del problema . . . . . . . . . . . . . . 105
B.2. Página explicativa . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
B.3. Bloque B — Experimento 2: idoneidad del producto . . . . . . . . . . . . . . 106
. . . . . . . . . . . . . . . . . . . . 106
. . . . . . . . . . . . . . 107
B.4. Recomendaciones de muestra . . . . . . . . . . . . . . . . . . . . . . . . . . . 107

B.3.1. Parte 1 — System Usability Scale
B.3.2. Parte 2 — Idoneidad específica del producto

C. Técnicas Avanzadas de LATEX

C.1. Tablas Rotadas (Sideways Tables)

109
. . . . . . . . . . . . . . . . . . . . . . . . 109
C.1.1. Ejemplo de tabla rotada . . . . . . . . . . . . . . . . . . . . . . . . . . 109
C.1.2. Cuándo usar tablas rotadas . . . . . . . . . . . . . . . . . . . . . . . . 110
C.2. Páginas en Horizontal (Landscape) . . . . . . . . . . . . . . . . . . . . . . . . 110
C.2.1. Método recomendado: Comandos de la plantilla . . . . . . . . . . . . . 110
C.2.2. Diagrama de flujo del sistema (página horizontal) . . . . . . . . . . . . 113
C.2.3. Segunda página horizontal consecutiva . . . . . . . . . . . . . . . . . . 114
C.2.4. Cuándo usar páginas landscape . . . . . . . . . . . . . . . . . . . . . . 115
C.3. Inclusión de Documentos PDF Externos . . . . . . . . . . . . . . . . . . . . . 115
C.3.1. Sintaxis básica . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
C.3.2. Opciones más utilizadas . . . . . . . . . . . . . . . . . . . . . . . . . . 116
C.3.3. Ejemplo: Documento PDF incluido . . . . . . . . . . . . . . . . . . . . 116
C.3.4. Múltiples páginas en una hoja . . . . . . . . . . . . . . . . . . . . . . . 119
C.4. Figuras de Ancho Completo . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.4.1. Figura que invade márgenes . . . . . . . . . . . . . . . . . . . . . . . . 119
C.5. Notas al Margen . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.5.1. Uso básico . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.6. Marcas de Agua
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
C.7. Texto en Columnas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
. . . . . . . . . . . . . . . . . . . . . . 120
C.8. Minipáginas y Cajas . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
C.8.1. Ejemplo de minipáginas . . . . . . . . . . . . . . . . . . . . . . . . . . 121
. . . . . . . . . . . . . . . . . . . . . . . . . 121

C.9. Resumen de Paquetes Utilizados

C.7.1. Ejemplo de texto en columnas

Índicedefiguras

4.1.

4.2.

4.3.

4.4.

 Mockup de las vistas principales de la interfaz de NewsEra. La interfaz
permite a cualquier usuario publicar contenido y consultar validaciones; para
emitir  votos  se  requiere  conectar  una  cartera  MetaMask  y  tener  reputación
mínima acreditada en el contrato ReputationSystem.
. . . . . . . . . . . . .
 Arquitectura global del sistema NewsEra: capas y flujos de interacción. El
contenido de los artículos se almacena en IPFS; los registros de publicación,
validación y reputación, en los contratos inteligentes; los metadatos e índices,
en PostgreSQL; la interfaz de usuario interactúa con las tres capas. . . . . . .
 Máquina de estados de ValidationRegistry. El estado PENDING_REOPEN
es  transitorio:  se  activa  internamente  cuando  se  alcanza  reopenThreshold
. . . . .
solicitudes y se resuelve de forma inmediata al abrir la nueva ronda.
 Logotipo de NewsEra: monograma NE con marca de verificación integrada,
generado  con  Gemini  a  partir  del  prompt  de  generación  de  imagen  que  se
. . . . . . . . . . . . . . . . . . . . . . . . . . . . .
reproduce a continuación.

39

40

44

58

C.1.

 Diagrama de flujo completo del sistema en página horizontal

. . . . . . . 113

xvii

4

15

20
27

30
41

45
50
58
61

63
64
65
65

Índice de tablas

1.1.

 Trazabilidad entre objetivos específicos, componentes del sistema y carácter
en el alcance del trabajo. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

2.1.

 Correspondencia entre componentes de NewsEra y fundamentos del estado
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

del arte.

3.1.
3.2.

4.1.
4.2.
4.3.

4.4.
4.5.
4.6.

5.1.
5.2.
5.3.
5.4.

C.1.
C.2.

C.3.
C.4.
C.5.

 Planificación de sprints y objetivos asociados. . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . .
 Registro de riesgos del proyecto.

 Funcionalidades de alto nivel (FEAT) de STQR 1 y sus casos de uso. . . .
. . . . . . . .
 Distribución de datos entre las capas del sistema NewsEra.
 Efectos reputacionales completos en  ValidationRegistry. Los efectos
de ronda propia se aplican al cerrar cada ronda; los retroactivos, al llamar a
claimRetroactiveReputation (máximo ±3 acumulados).
. . . . . . . . . .
. . . . . .
 Funciones principales de los contratos inteligentes de NewsEra.
 Paleta de color de la identidad visual de NewsEra.
. . . . . . . . . . . . .
 Actores, contratos y eventos en el flujo de publicación y validación. . . . .

. . .
 Direcciones de despliegue previstas en Sepolia (pendiente Sprint 9).
 Coste de gas de las operaciones principales de los contratos. . . . . . . . .
 Líneas de código por capa del sistema (Sprint 4). . . . . . . . . . . . . . .
. . . . . .
 Grado de cumplimiento de los objetivos específicos del trabajo.

 Comparativa completa de características por módulo del sistema desarrollado111
 Matriz de trazabilidad requisitos-módulos (aprovechando el ancho de página

landscape) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 113
 Tabla adicional de ejemplo en segunda página landscape . . . . . . . . . . 114
 Opciones principales de \includepdf . . . . . . . . . . . . . . . . . . . . 116
 Paquetes y comandos LATEX para técnicas avanzadas . . . . . . . . . . . . 121

xix

Índice de Códigos

4.1. solidity . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.2. text
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.3. text
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.4. text

51
52
53
54

C.1. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 109
C.2. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 110
C.3. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
C.4. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.5. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.6. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
C.7. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
C.8. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
C.9. LATEX . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120

xxi

1.  Introducción

La información es el sustrato sobre el que se construye el conocimiento colectivo de una
sociedad. Su libre circulación y su veracidad son condiciones necesarias para el ejercicio de la
democracia, la toma de decisiones informadas y la cohesión social. Sin embargo, el ecosistema
digital contemporáneo ha transformado profundamente la forma en que se produce, distri-
buye y consume información, generando condiciones que favorecen la propagación masiva de
contenido falso o manipulado a una velocidad y escala sin precedentes históricos. Este trabajo
aborda ese problema desde una perspectiva tecnológica y propone una solución basada en la
descentralización, la criptografía y la gobernanza comunitaria.

1.1.  Motivación

La información no es un bien neutral. En las sociedades contemporáneas, el control sobre
qué  información  circula,  cómo  se  enmarca  y  a  quién  llega  constituye  una  forma  de  poder
político y económico de primer orden. La teoría del espacio público elaborada por Habermas
(1989)  sostiene  que  una  democracia  requiere  un  ámbito  de  deliberación  libre  e  igualitario
donde los ciudadanos puedan formarse una opinión sobre los asuntos comunes. Sin embargo,
los sistemas de distribución de información que estructuran ese espacio público —los medios
de comunicación, tanto públicos como privados— están sometidos a presiones estructurales
que los alejan de esa función democrática.

Herman y Chomsky (1988) documentaron, en su modelo de propaganda, cómo los grandes
medios de comunicación operan como instituciones que producen y distribuyen información
subordinada a los intereses de sus propietarios, anunciantes y fuentes gubernamentales. Esta
captura estructural no requiere de conspiraciones explícitas: se ejerce a través de la propiedad
concentrada, la dependencia publicitaria, la autocensura y los mecanismos de acceso a las
fuentes de  poder  (McChesney, 2008).  El resultado es  un ecosistema informativo en el que
la agenda pública —qué problemas se visibilizan, qué marcos interpretativos se aplican, qué
voces tienen acceso al debate— refleja sistemáticamente los intereses de grupos con capacidad
para influir sobre esas instituciones.

La digitalización no ha resuelto este problema; en muchos aspectos, lo ha agravado. La
concentración de la distribución de información en un reducido número de plataformas tec-
nológicas ha añadido una nueva capa de intermediación opaca, cuyos algoritmos determinan
qué  contenidos  se  amplifican  y  cuáles  se  suprimen  sin  ningún  mecanismo  de  rendición  de
cuentas democrática (Pariser, 2011). Al mismo tiempo, la baja barrera de entrada para la
publicación digital ha generado un ecosistema ruidoso en el que distinguir información ve-
raz de contenido manipulado se ha convertido en una tarea cognitivamente exigente para el
ciudadano ordinario (Wardle & Derakhshan, 2017).

La tecnología blockchain ofrece, por primera vez, una infraestructura técnica capaz de sos-
tener un sistema de información que sea estructuralmente resistente a la captura por cualquier
actor individual —económico, político o institucional—, porque las reglas que gobiernan qué

1

2

Introducción

se publica, quién valida y cómo se calcula la reputación están codificadas en contratos in-
teligentes que ningún actor puede modificar unilateralmente (Buterin, 2014). Este trabajo
explora esa posibilidad.

1.2.  Planteamiento del problema

El problema que este trabajo aborda no es la existencia de noticias falsas como fenómeno
aislado, sino la captura estructural de los sistemas de distribución de información
por parte de grupos con intereses particulares. Esta captura opera en tres niveles comple-
mentarios:

En primer lugar, la dependencia estructural de los medios frente al poder econó-
mico y político. Los medios de comunicación, tanto públicos como privados, operan dentro
de  estructuras  de  propiedad  y  financiación  que  condicionan  su  línea  editorial.  Los  medios
públicos  están  expuestos  a  la  presión  de  los  gobiernos  de  turno;  los  privados,  a  la  de  sus
accionistas y anunciantes. En ambos casos, la información se convierte en un instrumento al
servicio de intereses particulares antes que en un bien común al servicio de la ciudadanía (Her-
man & Chomsky, 1988; McChesney, 2008). El ciudadano no tiene acceso a los mecanismos
que determinan qué se publica, qué se silencia y con qué encuadre se presenta la realidad.

En segundo lugar, la opacidad e irresponsabilidad de los sistemas de distribución
digital. Las plataformas tecnológicas que median la circulación de información a escala ma-
siva —redes sociales, agregadores de contenidos, motores de búsqueda— toman decisiones
algorítmicas sobre qué contenidos se amplifican y cuáles se suprimen sin ningún mecanismo
de transparencia ni rendición de cuentas democrática (Pariser, 2011). Estas decisiones tie-
nen consecuencias políticas directas, pero escapan al escrutinio público y no están sujetas a
ninguna forma de gobernanza colectiva.

En tercer lugar, la ausencia de infraestructura ciudadana para la verificación au-
tónoma.  El  ciudadano  ordinario  carece  de  herramientas  accesibles  y  técnicamente  fiables
para verificar de forma independiente la autenticidad, la autoría y el historial de modifica-
ción de un contenido informativo. No existe un registro público, inmutable y auditable de
qué se publicó, quién lo publicó y si ha sido alterado desde entonces, lo que hace imposible
exigir responsabilidades a los actores que manipulan la información (Hasan & Salah, 2019).

1.3.  Propuesta y enfoque

NewsEra  no  pretende  mejorar  los  sistemas  de  distribución  de  información  existentes  ni
añadir una capa de verificación sobre los medios tradicionales. Su propuesta es más radical:
construir  una  infraestructura  alternativa  de  publicación  y  validación  de  infor-
mación que sea estructuralmente resistente a la captura por cualquier grupo de
poder, ya sea económico, político o institucional.

La clave de esta resistencia estructural reside en que las reglas que gobiernan el sistema no
están en manos de ninguna entidad —no hay una empresa que pueda cambiar el algoritmo,
ni  un  gobierno  que  pueda  exigir  la  eliminación  de  contenidos,  ni  un  consejo  editorial  que
pueda imponer una línea—. Esas reglas están codificadas en contratos inteligentes desple-
gados en una blockchain pública, donde son visibles, auditables e inmutables para cualquier
participante (Buterin, 2014).

1.4.  Objetivo general

3

Sobre esta base, el sistema articula tres mecanismos complementarios. En primer lugar,
cualquier ciudadano puede publicar contenido informativo en la plataforma; ese contenido
queda registrado con un hash criptográfico que garantiza su inmutabilidad y permite detec-
tar cualquier alteración posterior (Nakamoto, 2008). En segundo lugar, una comunidad de
validadores  con  reputación  acreditada  emite  juicios  sobre  la  veracidad  del  contenido;  esos
juicios quedan registrados permanentemente, haciendo responsables públicamente a quienes
validan (Lesaege et al., 2019). En tercer lugar, un mecanismo de reputación y gobernanza
—núcleo del trabajo— determina qué participantes tienen capacidad de validar y con qué
peso,  calculando  esa  reputación  a  partir  del  historial  verificable  de  cada  usuario,  sin  que
ningún actor externo pueda interferir en ese cálculo.

El resultado es un espacio de información donde la credibilidad no la otorga ningún medio,
ningún gobierno ni ninguna plataforma, sino la participación colectiva y trazable de la propia
ciudadanía. De forma complementaria, el proyecto contempla la integración opcional de he-
rramientas de Inteligencia Artificial (IA) para el análisis automático de contenido —detección
de duplicados, identificación de sesgos o análisis de imágenes manipuladas— como apoyo al
criterio humano de los validadores (Zhou & Zafarani, 2020).

1.4.  Objetivo general

El objetivo general del presente TFG es diseñar e implementar un prototipo funcional
de NewsEra: una plataforma descentralizada para la validación y difusión de información
veraz  mediante  tecnología  blockchain  y  mecanismos  de  gobernanza  distribuida,  en  la  que
la confianza no dependa de entidades centrales sino de la participación colectiva y trazable
de  los  usuarios.  Con  ello  se  pretende  demostrar  la  viabilidad  técnica  y  social  de  aplicar
esta  tecnología  a  la  resolución  del  problema  de  la  captura  estructural  de  los  sistemas  de
información.

1.5.  Objetivos específicos

Para alcanzar el objetivo general, se definen los siguientes objetivos específicos:

1. OE1 — Análisis del estado del arte. Revisar la literatura científica y técnica exis-
tente en materia de desinformación digital, sistemas blockchain para la verificación de
contenidos, mecanismos de gobernanza distribuida y sistemas de reputación en redes
P2P, con el fin de identificar las soluciones previas y las brechas que justifican la pro-
puesta de NewsEra.

2. OE2  —  Diseño  de  la  arquitectura  del  sistema.  Definir  la  arquitectura  de  la
plataforma, especificando los componentes de la capa blockchain (contratos inteligentes,
modelo de datos en cadena), la capa de backend off-chain y la interfaz de usuario, así
como los flujos de interacción entre publicadores, validadores y la red.

3. OE3 — Implementación del sistema descentralizado de publicación y verifi-
cación de contenidos. Desarrollar en Solidity los contratos inteligentes que soporten
el  registro  de  publicaciones,  el  proceso  de  verificación  por  parte  de  validadores  y  la

4

Introducción

consulta del historial de validaciones, garantizando la trazabilidad e inmutabilidad de
todos los registros en la blockchain.

4. OE4  —  Diseño  e  implementación  del  mecanismo  de  reputación  y  gober-
nanza para validadores. Diseñar e implementar el núcleo del sistema: el mecanismo
distribuido que calcula y actualiza la reputación de cada validador en función de su
historial  de  participación,  que  regula  el  acceso  al  rol  de  validador  y  que  codifica  las
reglas de gobernanza de la comunidad en contratos inteligentes auditables y resistentes
a la manipulación.

5. OE5 — Desarrollo del prototipo de interfaz de usuario. Construir una interfaz
web funcional que permita a los participantes publicar contenido informativo, emitir y
consultar verificaciones, visualizar el estado de reputación de los validadores y explorar
el historial de validaciones almacenado en la blockchain.

6. OE6 — Integración opcional de herramientas de Inteligencia Artificial. Estu-
diar e integrar, como capa de análisis complementaria al criterio humano, herramientas
de IA para la detección automática de contenido duplicado, la identificación de sesgos
lingüísticos o el análisis de imágenes manipuladas, evaluando su aportación al proceso
de verificación comunitaria.

7. OE7 — Evaluación de la viabilidad del prototipo. Analizar el prototipo resultante
desde una perspectiva técnica y social, verificando que el sistema cumple los principios
de descentralización, trazabilidad y confianza sin dependencia de entidades centrales, e
identificando las limitaciones actuales y las líneas de trabajo futuro.

La Tabla 1.1 resume la correspondencia entre cada objetivo específico, los componentes
del sistema que lo sustentan y su carácter obligatorio u opcional en el alcance del presente
trabajo.

Tabla 1.1: Trazabilidad entre objetivos específicos, componentes del sistema y carácter en el
alcance del trabajo.

Obj. Descripción resumida

Componente principal

Carácter

OE1 Estado del arte
OE2 Arquitectura del sistema

Revisión bibliográfica
Diseño  global  (blockchain
+ backend + UI)

Obligatorio
Obligatorio

OE3 Publicación y verificación descentralizada Contratos inteligentes (So-

Obligatorio

OE4 Reputación y gobernanza de validadores

OE5 Prototipo de interfaz de usuario
OE6

Integración de herramientas de IA

OE7 Evaluación de viabilidad

lidity)
Contratos inteligentes (nú-
cleo del sistema)
Frontend web
Capa  de  análisis  comple-
mentaria
Prototipo completo

Obligatorio

Obligatorio
Opcional

Obligatorio

1.6.  Metodología

1.6.  Metodología

5

El trabajo sigue una metodología estructurada en tres fases secuenciales. La primera fase
consiste en la elaboración de un estado del arte exhaustivo sobre las tecnologías y mecanismos
implicados: desinformación digital, blockchain y contratos inteligentes, sistemas de identidad
descentralizada, mecanismos de gobernanza distribuida y técnicas de IA para el análisis de
contenido.  A  partir  de  este  análisis  se  identifican  las  brechas  que  motivan  la  propuesta  y
se extraen los principios de diseño del sistema. La segunda fase comprende el diseño de la
arquitectura y la implementación del prototipo funcional, priorizando el mecanismo de repu-
tación y gobernanza como componente central. La tercera fase evalúa el prototipo resultante
en términos de descentralización, trazabilidad y cumplimiento de los objetivos planteados,
identificando asimismo las limitaciones actuales y las líneas de trabajo futuro.

1.7.  Estructura del documento

El presente documento se organiza en seis capítulos cuyo contenido se describe a continua-

ción.

El  Capítulo  1  —el  presente—  contextualiza  el  problema  de  la  desinformación  digital,
motiva la propuesta de NewsEra, formula los objetivos del trabajo y describe la estructura
del documento.

El Capítulo 2 desarrolla el estado del arte en los tres ámbitos tecnológicos sobre los que
se sustenta el sistema: la tecnología blockchain y los contratos inteligentes, los sistemas de
identidad  y  gobernanza  descentralizadas,  y  las  técnicas  de  IA  aplicadas  a  la  detección  de
desinformación.

El Capítulo 3 describe la metodología de desarrollo empleada, las herramientas y tecno-

logías seleccionadas para cada capa del sistema, y la planificación temporal del trabajo.

El Capítulo 4 presenta el diseño e implementación del sistema NewsEra: la arquitectura
global, los contratos inteligentes de publicación y verificación, el mecanismo de reputación y
gobernanza de validadores, la capa de backend y el prototipo de interfaz de usuario.

El Capítulo 5 recoge los resultados obtenidos del prototipo funcional, analiza el comporta-
miento del mecanismo de gobernanza en distintos escenarios de uso y evalúa el cumplimiento
de los objetivos planteados.

El Capítulo 6 sintetiza las principales aportaciones del trabajo, expone las limitaciones
identificadas durante el desarrollo y propone las líneas de investigación y desarrollo futuro
que permitirían evolucionar NewsEra hacia un sistema de producción.

2.  Marco Teórico

Este capítulo desarrolla los fundamentos teóricos y tecnológicos sobre los que se sustenta el
diseño de NewsEra. Se revisan, en primer lugar, los enfoques académicos que conceptualizan
la relación entre información, poder y democracia. A continuación se examinan las tecnologías
que componen la arquitectura del sistema: la blockchain y los contratos inteligentes, los me-
canismos de gobernanza distribuida y sistemas de reputación, y la identidad descentralizada.
El capítulo concluye con una revisión de las técnicas de Inteligencia Artificial (IA) aplicadas
al análisis de contenido informativo, componente de carácter opcional en el sistema.

2.1.  Información, poder y democracia

La noción de que los medios de comunicación sirven a la democracia proporcionando a los
ciudadanos información veraz e independiente tiene un fundamento normativo bien estableci-
do en la teoría política. La esfera pública conceptualizada por Habermas (1989) es el espacio
de  deliberación  racional  donde  los  ciudadanos  forman  opinión  sobre  los  asuntos  comunes,
condición que presupone acceso equitativo a información libre de distorsiones estratégicas.
Esta concepción normativa contrasta, sin embargo, con el funcionamiento real de los sistemas
mediáticos contemporáneos.

Herman y Chomsky (1988) desarrollaron el modelo de propaganda para describir cómo los
grandes medios de comunicación, lejos de actuar como contrapoder, operan como institucio-
nes al servicio de las élites económicas y políticas. Cinco filtros estructurales —la propiedad
concentrada, la dependencia publicitaria, el acceso privilegiado a las fuentes gubernamenta-
les, la presión externa organizada y la ideología dominante— condicionan sistemáticamente
qué información se produce, cómo se enmarca y qué voces tienen acceso al espacio público.
Este análisis, ampliado por McChesney (2008) para el contexto de la concentración digital,
evidencia que la desinformación no es solo el resultado de actores maliciosos externos, sino en
gran medida un producto estructural de los propios sistemas de distribución de información.

La digitalización ha añadido una dimensión algorítmica a esta captura estructural. Pariser
(2011) demostró que los algoritmos de personalización de contenido crean burbujas informa-
tivas  que  refuerzan  las  creencias  previas  del  usuario,  reducen  la  exposición  a  perspectivas
diversas y facilitan la manipulación de la agenda pública por parte de quienes controlan esos
algoritmos. Es en este contexto donde la propuesta de una infraestructura informativa descen-
tralizada adquiere su dimensión política: no como mejora técnica de los sistemas existentes,
sino como alternativa estructural a su captura.

7

8

Marco Teórico

2.2.  Tecnología Blockchain

2.2.1.  Fundamentos criptográficos y estructura de datos

Una blockchain es un registro distribuido, ordenado cronológicamente e inmutable de tran-
sacciones, mantenido de forma colectiva por una red de nodos sin necesidad de una autoridad
central de coordinación (Nakamoto, 2008). Su diseño combina tres primitivas criptográficas
fundamentales: las funciones hash, los árboles de Merkle y la criptografía de clave pública y
privada.

Una  función  hash  criptográfica  —como  SHA-256—  transforma  una  entrada  de  longitud
arbitraria en una salida de longitud fija (el digest) de forma determinista y prácticamente
irreversible: cualquier modificación mínima en la entrada produce un hash completamente
diferente (efecto avalancha). Esta propiedad es la base de la inmutabilidad de la blockchain:
cada bloque contiene el hash del bloque anterior, formando una cadena en la que alterar un
bloque invalida todos los posteriores.

Los árboles de Merkle (Merkle Trees) son estructuras de datos jerárquicas en las que
cada nodo hoja contiene el hash de una transacción, y cada nodo interno contiene el hash
de la concatenación de sus nodos hijos (Nakamoto, 2008). La raíz del árbol (Merkle Root)
resume criptográficamente el conjunto completo de transacciones de un bloque, lo que permite
verificar  la  pertenencia  de  una  transacción  concreta  al  bloque  en  tiempo  logarítmico  sin
necesidad de descargar el bloque completo.

La criptografía asimétrica (par clave pública/privada) permite a cada participante fir-
mar digitalmente sus transacciones con su clave privada. Cualquier nodo puede verificar esa
firma con la clave pública correspondiente, sin que sea necesario revelar la clave privada ni
recurrir a una autoridad certificadora.

2.2.2.  Bitcoin: el libro mayor distribuido

El protocolo Bitcoin, descrito por Nakamoto (2008), resolvió el problema del doble gasto
en un entorno sin confianza mediante la combinación de una cadena de bloques encadenados
criptográficamente  con  un  mecanismo  de  consenso  basado  en  prueba  de  trabajo  (Proof  of
Work, PoW). En PoW, los nodos compiten por encontrar un valor entero arbitrario denomi-
nado nonce (number used once) que, incluido en la cabecera del bloque, produce un hash del
bloque que cumple un objetivo de dificultad: dicho hash debe ser numéricamente inferior a un
umbral prefijado, lo que en la práctica equivale a exigir que comience por un número mínimo
de ceros. Como el hash es impredecible, la única estrategia viable es el ensayo sistemático de
millones de valores de nonce por segundo. El umbral de dificultad se ajusta periódicamente
para que la red produzca un nuevo bloque cada diez minutos aproximadamente, con indepen-
dencia de la potencia de cómputo total disponible. El nodo que encuentra primero un nonce
válido difunde el bloque a la red, que lo verifica y lo incorpora a la cadena.

El consenso en Bitcoin es probabilístico: una transacción se considera definitiva cuando está
enterrada bajo suficientes bloques posteriores como para que revertirla requiera más poder
de cómputo que el que controla honestamente el resto de la red (regla del 51 %). Este diseño
garantiza la inmutabilidad del registro sin necesidad de ninguna entidad central, pero tiene
un elevado coste energético y una capacidad de procesamiento limitada.

2.3.  Contratos inteligentes y Solidity

9

2.2.3.  Ethereum y los contratos inteligentes

Ethereum, propuesto por Buterin (2014), extiende el modelo de Bitcoin incorporando una
máquina virtual de propósito general —la Ethereum Virtual Machine (EVM)— que permite
ejecutar código arbitrario en la blockchain. Esto hace posible los contratos inteligentes:
programas cuyo código y estado se almacenan en la cadena, se ejecutan de forma determinista
en todos los nodos y no pueden ser alterados una vez desplegados sin el consenso de la red. El
resultado es que las reglas de un sistema —en el caso de NewsEra, las reglas de publicación,
verificación y gobernanza— pueden codificarse en contratos que ningún actor puede modificar
unilateralmente.

Ethereum también resolvió parte de las limitaciones energéticas de PoW mediante la tran-
sición a Proof of Stake (PoS) en 2022 (conocida como The Merge) (Ethereum Foundation,
2022). En PoS, los validadores deben comprometer (stake) una cantidad de criptomoneda
como garantía; si intentan validar bloques fraudulentos, pierden esa garantía (slashing). Este
mecanismo mantiene la seguridad de la red con un consumo energético radicalmente inferior
al de PoW.

2.2.4.  Tipos de redes blockchain

Las redes blockchain se clasifican según su modelo de acceso (Ding et al., 2023):

• Pública (permissionless):  cualquier  nodo  puede  unirse,  leer  y  escribir  en  la  cadena.
Ofrece  máxima  descentralización  y  resistencia  a  la  censura,  pero  menor  rendimiento
(Ethereum, Bitcoin).

• Privada: acceso restringido a un conjunto predefinido de participantes. Mayor rendi-
miento, pero dependiente de una entidad central de control (Hyperledger Fabric).

• Consorcio: un grupo de organizaciones comparte el control de la red. Equilibrio entre

rendimiento y descentralización parcial.

Para NewsEra, una red pública es la opción coherente con el objetivo de resistencia estruc-

tural a la captura: ningún actor puede controlar quién participa ni qué reglas se aplican.

2.3.  Contratos inteligentes y Solidity

2.3.1.  Concepto y propiedades

Un contrato inteligente (smart contract) es un programa almacenado en la blockchain que
se ejecuta automáticamente cuando se cumplen las condiciones codificadas en su lógica, sin
intervención  humana  y  sin  posibilidad  de  interferencia  externa  una  vez  desplegado  (Bute-
rin, 2014). Sus propiedades fundamentales son la inmutabilidad del código desplegado, la
transparencia (cualquiera puede auditar el código), la autonomía (se ejecuta sin depender
de  ningún  tercero)  y  el  determinismo (dado  el  mismo  estado  y  los  mismos  parámetros,
produce siempre el mismo resultado en todos los nodos de la red).

Estas  propiedades  hacen  de  los  contratos  inteligentes  el  mecanismo  idóneo  para  imple-
mentar las reglas de gobernanza de NewsEra: las condiciones bajo las que un usuario puede

10

Marco Teórico

convertirse en validador, el algoritmo de cálculo de reputación y el proceso de registro de pu-
blicaciones y verificaciones son reglas públicas, auditables y que ningún actor puede alterar
de forma unilateral.

2.3.2.  Solidity: lenguaje de programación

Solidity es el lenguaje de programación orientado a objetos más utilizado para el desarrollo
de contratos inteligentes en la EVM. Con una sintaxis influida por C++, Python y JavaScript,
Solidity compila a bytecode ejecutable por la EVM y es el estándar de facto para el ecosistema
Ethereum.

Dado que el código de un contrato inteligente es inmutable una vez desplegado, las vul-
nerabilidades  de  seguridad  tienen  consecuencias  especialmente  graves:  los  fondos  o  datos
protegidos por un contrato defectuoso pueden quedar expuestos de forma permanente. Los
ataques  más  frecuentes  incluyen  la  reentrancia  (reentrancy),  el  desbordamiento  aritmético
(integer overflow/underflow) y la dependencia de valores predecibles como la marca de tiem-
po del bloque (Wang et al., 2023). El desarrollo de contratos inteligentes seguros requiere,
por tanto, un ciclo de diseño que incluya revisión formal del código, pruebas exhaustivas y,
cuando sea posible, verificación formal.

Una característica fundamental de Solidity para la arquitectura de sistemas como NewsEra
es el mecanismo de eventos (event/emit): los contratos pueden emitir eventos que quedan
registrados en el log de transacciones de Ethereum y son indexables por sistemas externos sin
incurrir en el coste de almacenamiento en estado persistente. Este mecanismo es la base de la
sincronización entre la capa on-chain y los sistemas off-chain: un servicio externo se suscribe
a los eventos del contrato para mantener una réplica actualizada del estado sin interrogar la
cadena en cada consulta.

2.4.  Gobernanza distribuida y sistemas de reputación

2.4.1.  Organizaciones Autónomas Descentralizadas (DAOs)

Una Decentralized Autonomous Organization (DAO) es una organización cuyas reglas de
funcionamiento —quién puede participar, cómo se toman las decisiones, cómo se gestionan
los recursos colectivos— están codificadas en contratos inteligentes en una blockchain públi-
ca  (Ding  et  al.,  2023).  La  ausencia  de  dirección  central  y  la  automatización  de  las  reglas
de gobernanza hacen de las DAOs la arquitectura de referencia para implementar sistemas
comunitarios resistentes a la captura por actores individuales.

Las DAOs han demostrado su viabilidad en contextos muy diversos: desde la gestión de
protocolos financieros descentralizados (DeFi) hasta la coordinación de proyectos de código
abierto y la resolución descentralizada de disputas. Sin embargo, la investigación empírica
ha identificado también limitaciones estructurales relevantes: Feichtinger et al. (2023), en un
estudio de 21 DAOs activas, encontraron alta concentración de poder de voto, elevados costes
ocultos de participación en la gobernanza on-chain y una proporción significativa de actividad
de votación sin efecto real. Messias et al. (2023) confirmaron que en las DAOs de Compound
y Uniswap, tan solo entre 3 y 5 votantes eran suficientes para determinar el resultado de la
mayoría de las propuestas.

2.4.  Gobernanza distribuida y sistemas de reputación

11

Estas limitaciones evidencian que el diseño del mecanismo de gobernanza es crítico: la mera
descentralización técnica no garantiza una distribución equitativa del poder de decisión. El
diseño de NewsEra debe tener en cuenta estas dinámicas para evitar que el sistema reproduzca
las asimetrías que pretende combatir.

2.4.2.  Mecanismos de votación

Los mecanismos de votación on-chain más empleados en las DAOs actuales son (Ding et

al., 2023):

• Un token, un voto (token-weighted voting): el poder de voto es proporcional a los
tokens que posee cada participante. Incentiva la participación de grandes tenedores pero
reproduce la concentración de poder económico.

• Un participante, un voto (one-person-one-vote): requiere mecanismos de verifica-
ción de identidad para evitar ataques Sybil (Douceur, 2002) —en los que una entidad
crea múltiples identidades falsas para obtener influencia desproporcionada sobre el sis-
tema—.

• Votación cuadrática (quadratic voting): cada participante dispone de un presupuesto
fijo de créditos de voto; emitir 𝑛 votos sobre una propuesta cuesta 𝑛2 créditos. El coste
creciente desincentiva el acaparamiento del poder de voto, mientras que el presupuesto
compartido permite expresar preferencias intensas: gastar más créditos en lo que más
importa a costa de perder influencia en otras decisiones (Weyl & Posner, 2019).

• Gobernanza delegada (liquid democracy): los participantes pueden delegar su voto en
representantes de confianza, combinando la participación directa con la representación.

2.4.3.  Sistemas de reputación en redes distribuidas

Un sistema de reputación asigna a cada participante de una red una puntuación que refleja
la calidad de su comportamiento histórico, con el objetivo de alinear los incentivos individuales
con  el  bienestar  colectivo  (Adler  &  de  Alfaro,  2007).  En  redes  distribuidas,  el  sistema  de
reputación sustituye a la autoridad central como mecanismo de confianza: un participante
con alta reputación es de fiar no porque lo avale ninguna institución, sino porque su historial
verificable así lo demuestra.

Los desafíos técnicos de los sistemas de reputación distribuidos incluyen la resistencia a ata-
ques Sybil —en los que un actor crea múltiples identidades para inflar su propia reputación—,
el problema del whitewashing —abandonar una identidad con mala reputación y empezar de
nuevo con una nueva— y la agregación justa de valoraciones de fuentes con distinto nivel de
confianza (Feichtinger et al., 2023).

Adler y de Alfaro (2007) propusieron, en el contexto de Wikipedia, un sistema de reputación
de contenidos basado en el análisis de la supervivencia de las ediciones: el texto que persiste
en el tiempo sin ser revertido por otros editores es indicativo de calidad, y los editores cuyas
contribuciones perduran acumulan reputación. Este principio —la reputación como función
del historial verificable de contribuciones— es directamente aplicable al contexto de validación
comunitaria de contenidos de NewsEra.

12

Marco Teórico

2.4.4.  Mecanismos de incentivo y teoría de juegos

El diseño de un sistema de gobernanza distribuida es, en esencia, un problema de diseño de
mecanismos: definir las reglas del juego de forma que los participantes racionales y egoístas
actúen de modo que produzca el resultado colectivamente deseable (Ding et al., 2023). En
el contexto de NewsEra, el objetivo es que los validadores emitan juicios honestos sobre la
veracidad del contenido.

Los  mecanismos  más  empleados  para  alinear  incentivos  en  este  tipo  de  sistemas  son  la
penalización económica (slashing): los validadores que emiten juicios maliciosos o incon-
sistentes con el consenso pierden parte de su garantía depositada; y la reputación acumu-
lativa: los validadores cuyo historial de juicios es coherente con el consenso de la comunidad
acumulan  reputación,  que  les  otorga  mayor  peso  y  visibilidad  dentro  del  sistema.  Kleros
(Lesaege et al., 2019) combina ambos mecanismos en un sistema de resolución de disputas
descentralizado en el que los jurados pierden su depósito si votan en minoría, incentivando
la coordinación hacia el juicio honesto.

2.5.  Identidad descentralizada

El problema de la identidad es central en cualquier sistema de reputación: si una entidad
puede crear múltiples identidades sin coste (ataque Sybil), el sistema de reputación es tri-
vialmente manipulable. La identidad descentralizada aborda este problema sin recurrir a una
autoridad central de certificación.

Los Decentralized Identifier (DID) son identificadores únicos globales que un sujeto puede
crear y controlar de forma autónoma, sin necesidad de que ninguna autoridad central los emita
o los revoque (World Wide Web Consortium, 2022). Un DID se resuelve en un documento DID
que contiene las claves criptográficas públicas del sujeto, lo que permite verificar de forma
independiente que quien afirma controlar ese identificador es efectivamente quien posee la
clave privada correspondiente.

Las Verifiable Credential (VC) son afirmaciones firmadas digitalmente por un emisor (por
ejemplo, una universidad, un organismo oficial o la propia comunidad) sobre un sujeto iden-
tificado por su DID (Mazzocca et al., 2025). A diferencia de los certificados digitales tradicio-
nales, las VCs permiten una divulgación selectiva: el titular puede demostrar que posee cierta
credencial sin revelar la totalidad de la información que contiene, preservando su privacidad.
La adopción de DIDs y VCs como estándar del W3C ha impulsado el desarrollo de un
ecosistema de identidad auto-soberana (Self-Sovereign Identity, SSI) en el que el usuario con-
trola sus propios datos de identidad y decide con quién los comparte (Allen, 2016; Mazzocca
et al., 2025). En NewsEra, este estándar ofrece una base para implementar el acceso al rol de
validador vinculado a una identidad verificable y resistente a ataques Sybil, sin comprometer
el anonimato de los participantes que no deseen revelar su identidad real.

2.6.  Almacenamiento descentralizado: IPFS

El InterPlanetary File System (IPFS) es un protocolo de red entre iguales diseñado para
el almacenamiento y la distribución descentralizada de contenido (Benet, 2014). A diferen-
cia del modelo tradicional basado en localización (location-based addressing), en el que un

2.7.  Inteligencia Artificial para el análisis de contenido (opcional)

13

recurso se identifica por la dirección del servidor que lo aloja, IPFS utiliza direccionamiento
por contenido (content addressing): cada objeto se identifica por el hash criptográfico de su
contenido, lo que garantiza su integridad de forma verificable y sin dependencia de ningún
servidor central.

Cuando un nodo IPFS publica un archivo, la red asigna a ese contenido un identificador
inmutable denominado CID (Content Identifier). Cualquier nodo que solicite ese CID recibirá
exactamente el mismo contenido, independientemente de quién lo sirva, y puede verificar su
integridad computando el hash localmente. Esta propiedad hace de IPFS una solución idónea
para sistemas que requieren publicación permanente y verificable de documentos sin depender
de una infraestructura centralizada.

Para garantizar la persistencia del contenido en la red IPFS, es necesario que al menos un
nodo lo mantenga anclado (pinned). Servicios de anclaje como Pinata actúan como infraes-
tructura de respaldo: reciben el CID generado por el publicador y se comprometen a mantener
el contenido accesible en la red, ofreciendo una API REST que simplifica la integración en
aplicaciones web.

En NewsEra, IPFS/Pinata actúa como capa de almacenamiento de artículos: el contenido
textual se publica en IPFS y únicamente su CID queda registrado en la cadena de bloques
como  contentHash.  Este  diseño  minimiza  el  coste  de  gas  —almacenar  texto  completo  on-
chain sería económicamente inviable— y mantiene la verificabilidad: cualquier usuario puede
obtener  el  artículo  desde  IPFS  y  comprobar  que  su  hash  coincide  con  el  registrado  en  el
contrato.

2.7.  Inteligencia Artificial para el análisis de contenido (opcional)

STICKY-NOTE  Carácter opcional de esta sección La integración de herramientas de IA para el análisis
de  contenido  es  un  componente  opcional  del  sistema  NewsEra  (objetivo  OE6).  Esta
sección revisa el estado del arte para orientar su posible implementación futura, pero no
es un requisito del prototipo descrito en este trabajo.

2.7.1.  Detección de desinformación mediante NLP

La detección automática de desinformación mediante Natural Language Processing (NLP)
es  un  campo  de  investigación  activo  que  ha  experimentado  avances  sustanciales  desde  la
irrupción de los modelos de lenguaje preentrenados basados en la arquitectura Transformer
(Zhou & Zafarani, 2020). Los enfoques previos —basados en características léxicas, estilo-
métricas y de redes de propagación— han sido ampliamente superados por modelos como
BERT, RoBERTa y sus derivados, que capturan representaciones contextuales profundas del
texto y permiten clasificar el contenido con una precisión superior al 95 % en los conjuntos
de evaluación estándar (Shu et al., 2017).

La tarea de detección de noticias falsas se formula habitualmente como un problema de cla-
sificación binaria (verdadero/falso) o multiclase (según el grado de manipulación), entrenado
sobre conjuntos de datos etiquetados como FakeNewsNet, LIAR o WELFake. Sin embargo,
los  modelos  entrenados  en  un  dominio  concreto  presentan  dificultades  de  generalización  a

14

Marco Teórico

otros dominios o idiomas, lo que limita su aplicabilidad directa en un sistema global como
NewsEra (Zhou & Zafarani, 2020).

2.7.2.  Detección de contenido multimedia manipulado

Más  allá  del  análisis  de  texto,  la  desinformación  moderna  incorpora  imágenes  y  vídeos
manipulados mediante técnicas de deep learning (deepfakes). Los enfoques de detección más
eficaces combinan redes convolucionales (CNN) para el análisis de artefactos de compresión y
señales de manipulación en frecuencias espaciales con modelos de atención para la detección
de inconsistencias temporales en secuencias de vídeo (Hasan & Salah, 2019).

2.7.3.  Detección de duplicados y sesgos

La detección de contenido duplicado o parafraseado (near-duplicate detection) puede abor-
darse mediante técnicas de embedding semántico que proyectan los documentos en un espacio
vectorial de alta dimensión, donde la similitud coseno mide el grado de solapamiento semán-
tico independientemente de las diferencias superficiales de formulación. El análisis de sesgos
lingüísticos —detección de  lenguaje cargado emocionalmente, sensacionalismo o encuadres
sesgados— se puede abordar mediante clasificadores entrenados sobre corpus anotados con
métricas de objetividad periodística (Zhou & Zafarani, 2020).

En el contexto de NewsEra, estas herramientas actuarían como una capa de análisis previo
que asiste al criterio humano de los validadores, proporcionando señales automáticas sobre la
novedad del contenido, su alineación con patrones conocidos de manipulación y la presencia de
elementos multimedia de autenticidad cuestionable. La decisión final de validación permanece
siempre en manos de la comunidad.

2.8.  Síntesis: bases tecnológicas de NewsEra

El recorrido realizado en este capítulo permite identificar las bases tecnológicas específicas
sobre las que se apoya el diseño de NewsEra. La Tabla 2.1 resume la correspondencia entre
cada componente del sistema y la tecnología o concepto del estado del arte que lo fundamenta.

2.8.  Síntesis:  bases tecnológicas de NewsEra

15

Tabla  2.1:  Correspondencia  entre  componentes  de  NewsEra  y  fundamentos  del  estado  del
arte.
Componente de NewsEra

Referencia

Fundamenta-
ción teórica

Registro inmutable de publicaciones

Ejecución de reglas sin intermediarios

Gobernanza comunitaria

Reputación de validadores

Resistencia a ataques Sybil

Almacenamiento descentralizado de artículos

Análisis de contenido (opcional)

Cadena de bloques
+ hashes SHA-256
+ árboles de Mer-
kle

Contratos
inteli-
gentes en la EVM

DAOs  y  mecanis-
mos  de  votación
on-chain

(Nakamoto, 2008)

(Buterin, 2014)

(Ding et al., 2023)

Sistemas  de  repu-
tación  en  redes
P2P

(Adler  &  de  Alfaro,
2007;  Lesaege  et  al.,
2019)

Reputación  acu-
mulativa  on-chain
(prototipo);  iden-
tidad  descentra-
lizada  DIDs/VCs
W3C  (solución  de
producción)

IPFS con direccio-
namiento por con-
tenido (CID)

NLP  con  modelos
Transformer

(Adler  &  de  Alfaro,
(World  Wide
2007);
Web Consortium, 2022)

(Benet, 2014)

(Zhou & Zafarani, 2020)

3.  Metodología

Este capítulo describe el enfoque metodológico adoptado para la realización del presente
TFG. Se presenta el marco de desarrollo elegido, su adaptación al contexto de un proyec-
to individual académico, la planificación en fases, las hipótesis tecnológicas que guiarán la
implementación y la estrategia de validación del prototipo.

3.1.  Enfoque metodológico general

La metodología descrita en la propuesta del trabajo se articula en tres fases secuenciales:
elaboración del estado del arte, diseño de la propuesta a partir de sus conclusiones, e imple-
mentación de un prototipo que demuestre la viabilidad del sistema (Onyekachi, 2019). Esta
secuencia se corresponde con una aproximación iterativa e incremental al desarrollo de soft-
ware, en la que cada fase retroalimenta a las siguientes y el conocimiento acumulado durante
el estado del arte determina las decisiones de diseño e implementación.

Para organizar la fase de implementación de forma estructurada y adaptable, se adopta
Scrum como marco de trabajo ágil (Schwaber & Sutherland, 2020). La elección de Scrum
responde a tres razones principales: la naturaleza exploratoria del proyecto —en el que las
decisiones tecnológicas concretas evolucionan a medida que avanza el conocimiento del do-
minio—,  la  posibilidad  de  entregar  valor  incremental  con  cada  sprint  —lo  que  facilita  el
seguimiento del progreso con el tutor—, y la alineación con los objetivos específicos del tra-
bajo, que son independientes entre sí y pueden abordarse de forma progresiva.

3.2.  Scrum adaptado al proyecto individual

Scrum fue concebido originalmente para equipos de desarrollo de entre tres y nueve personas
(Schwaber & Sutherland, 2020). Su aplicación a un proyecto de desarrollo individual como un
TFG requiere adaptar los roles y las ceremonias del marco original manteniendo sus principios
esenciales: transparencia, inspección y adaptación.

3.2.1.  Adaptación de roles

En el contexto de este trabajo, los tres roles de Scrum se distribuyen de la siguiente forma:

• Product Owner: el tutor del trabajo, responsable de definir y priorizar los requisitos
del sistema, validar los incrementos al final de cada sprint y asegurar que el producto
se alinea con los objetivos del TFG.

• Scrum Master: el propio estudiante, responsable de garantizar que el proceso se sigue
correctamente, identificar impedimentos y buscar soluciones para mantener el ritmo de
trabajo.

17

18

Metodología

• Desarrollador: el propio estudiante, responsable de la implementación técnica de cada

incremento.

3.2.2.  Adaptación de ceremonias

Las ceremonias de Scrum se adaptan a la dinámica de un proyecto individual supervisado:

• Sprint Planning: al inicio de cada sprint, el estudiante selecciona del product backlog
los elementos a desarrollar, los descompone en tareas concretas y define el objetivo del
sprint.

• Daily Scrum: sustituido por un diario de desarrollo personal en el que se registran dia-
riamente el progreso, los impedimentos encontrados y las decisiones técnicas tomadas.
Este registro sirve de base para la memoria del trabajo.

• Sprint Review: reunión con el tutor al final de cada sprint en la que se presenta el

incremento desarrollado, se valida su corrección y se ajusta el backlog si procede.

• Sprint Retrospective: reflexión personal al final de cada sprint sobre el proceso de

trabajo, con el objetivo de identificar mejoras para el siguiente.

3.2.3.  Artefactos

Los artefactos de Scrum utilizados en el proyecto son:

• Product Backlog: lista priorizada de todos los requisitos del sistema, derivada direc-
tamente de los objetivos específicos OE1–OE7 definidos en el Capítulo 1. El backlog se
refinará continuamente a medida que el conocimiento del dominio evolucione durante
el desarrollo.

• Sprint Backlog: subconjunto de elementos del product backlog seleccionados para cada

sprint, con las tareas concretas asociadas a cada uno.

• Incremento: el resultado entregable al final de cada sprint: un componente funcional
del  sistema  (un  contrato  inteligente,  un  módulo  de  la  API  o  un  componente  de  la
interfaz) acompañado de sus pruebas automatizadas.

3.3.  Planificación en fases y sprints

El  proyecto  se  organiza  en  diez  fases,  cada  una  de  las  cuales  corresponde  a  uno  o  más
sprints de dos semanas de duración. La duración de cada sprint se establece en dos semanas,
lo que permite revisiones frecuentes con el tutor sin fragmentar excesivamente el trabajo.

Sprint 0 — Fundamentos (completado): elaboración del estado del arte, definición de
objetivos y justificación del trabajo. Esta fase corresponde a los capítulos 1 y 2 de la
presente memoria.

3.3.  Planificación en fases y sprints

19

Sprint 1 — Diseño de la arquitectura: definición  detallada  de  la  arquitectura  del  sis-
tema (OE2): componentes de cada capa, interfaces de comunicación, modelo de datos
on-chain y off-chain, y selección tecnológica definitiva para cada módulo.

Sprints 2–3 — Contratos inteligentes de registro y verificación: implementación de
los contratos Solidity responsables del registro inmutable de publicaciones y del proceso
de verificación por parte de los validadores (OE3). Incluye las pruebas unitarias de cada
función sobre Hardhat Network (red local).

Sprint 4 — Mecanismo de reputación: implementación del contrato ReputationSystem

(OE4): cálculo y actualización de reputación de validadores, control de acceso por ro-
les (OpenZeppelin AccessControl) y barrera de acceso mínima como primera defensa
contra ataques Sybil. Incluye pruebas unitarias de todos los escenarios de modificación
de reputación y acceso no autorizado.

Sprint 5 — Integración y auditoría de contratos (completado): integración de los tres

contratos (OE4): módulo de despliegue unificado con Hardhat Ignition, pruebas de ex-
tremo a extremo de la capa on-chain completa (flujos de publicación, votación, reaper-
tura y reputación retroactiva), análisis estático de seguridad con Slither y exportación
de ABIs para las capas superiores.

Sprint 6 — Mecanismo de reputación (II): ampliación de ValidationRegistry (OE3/OE4)
con una recompensa reputacional por publicar contenido que alcanza consenso TRUE y
una penalización si resuelve FALSE o UNVERIFIABLE, y con una vía de acceso merito-
crático al rol de validador mediante predicciones de práctica que no participan en el
consenso real.

Sprint 7 — Capa de backend: desarrollo de la API REST que orquesta la comunicación
entre la blockchain, la base de datos off-chain y el frontend. Incluye el modelo de datos
y las pruebas de integración de los endpoints.

Sprint 8 — Prototipo de interfaz de usuario: desarrollo del frontend web (OE5): pu-
blicación de contenido, consulta del estado de verificación, visualización de la reputación
de los validadores y conexión con una cartera digital.

Sprint 9 — Integración, pruebas y despliegue público: integración  de  todas  las  ca-
pas del sistema y pruebas de extremo a extremo sobre los escenarios de uso principales.
Ajuste  del  rendimiento  y  coste  de  gas  de  los  contratos.  Despliegue  definitivo  de  los
contratos en la testnet pública Sepolia para disponer de un prototipo verificable ex-
ternamente de cara a la entrega y la defensa.

Sprint 10 — Evaluación y documentación: análisis de los resultados del prototipo (OE7),

elaboración de los capítulos de resultados y conclusiones de la memoria, y preparación
de la defensa.

La Tabla 3.1 resume la correspondencia entre los sprints, los objetivos específicos cubiertos

y los entregables esperados.

20

Metodología

Tabla 3.1: Planificación de sprints y objetivos asociados.

Sprint Fase

Entregable

OE

Estado

0
1
2
3
4
5

6

7
8
9

Fundamentos
Arquitectura
Contratos (I)
Contratos (II)
Reputación
Integración

OE1
Marco teórico + objetivos
Documento de diseño del sistema
OE2
Contrato de registro de publicaciones OE3
OE3
Contrato de verificación + tests
OE4
Contrato de reputación + tests
OE4
Contratos  integrados  +  auditoría
Slither + ABIs

Completado
Completado
Completado
Completado
Completado
Completado

Reputación (II) Recompensa por publicación + acce-

OE3/OE4 Planificado

Backend
Frontend
Integración

10

Evaluación

so meritocrático por predicción
API REST + base de datos
Interfaz web funcional
Sistema integrado + tests E2E + des-
pliegue Sepolia
Informe de resultados + memoria

OE2
OE5
OE7

OE7

Planificado
Planificado
Planificado

En curso

3.4.  Principios de desarrollo

El diseño e implementación del prototipo de NewsEra se rige por un conjunto de principios
de  ingeniería  de  software  que  condicionan  tanto  la  estructura  del  código  como  la  elección
del stack tecnológico. Estos principios no constituyen restricciones arbitrarias, sino decisiones
conscientes  adoptadas  para  maximizar  la  corrección,  la  mantenibilidad  y  la  velocidad  de
implementación en el contexto de un proyecto académico individual con un horizonte temporal
definido.

El primer principio rector es KISS (Keep It Simple, Stupid): se priorizan soluciones simples
y directas sobre soluciones más elegantes pero de mayor complejidad. En el contexto de un
prototipo de TFG, la complejidad innecesaria tiene dos efectos negativos concretos: ralentiza
la implementación al multiplicar las decisiones de diseño que deben tomarse durante el de-
sarrollo, y dificulta la verificación de la corrección del sistema, ya que las rutas de ejecución
se vuelven más difíciles de razonar y de cubrir con pruebas. Cuando existe una solución sufi-
cientemente buena y una solución óptima, el prototipo adopta la primera si la diferencia de
complejidad es significativa y el beneficio marginal es reducido.

El segundo principio es DRY (Don’t Repeat Yourself ): cada regla de negocio o fragmento
de lógica del sistema existe en un único lugar del código. La duplicación de lógica introduce
invariablemente inconsistencias  cuando el  requisito  evoluciona, ya que obliga  a  localizar y
actualizar  manualmente  todas  las  copias.  En  el  contexto  de  un  sistema  distribuido  entre
capas heterogéneas —contratos Solidity, servidor TypeScript e interfaz de usuario—, DRY
implica también definir con precisión qué capa es la fuente de verdad para cada dato y evitar
recalcular en el cliente lo que el servidor ya ha procesado, o validar en el servidor lo que el
contrato ya hace cumplir de forma irrevocable.

El  tercer  principio,  y  quizás  el  más  determinante  en  la  arquitectura  del  sistema,  es  la
separación de responsabilidades: cada capa del sistema tiene un rol bien definido y no

3.5.  Stack tecnológico

21

invade el del resto. Los contratos inteligentes no almacenan texto completo; el servidor no
firma transacciones directamente en nombre del usuario; el frontend no contiene lógica de
negocio que deba mantenerse sincronizada con el servidor. Esta separación limita el impacto
de los cambios a la capa en la que se producen y facilita la sustitución independiente de cada
componente. Estas decisiones se reflejan directamente en la elección del stack tecnológico:
se prefieren frameworks ligeros con convenciones claras (Hono sobre Express), lenguajes con
tipado estático para detectar errores en tiempo de compilación (TypeScript) y herramientas
que reducen la toma de decisiones durante la implementación, permitiendo al desarrollador
concentrarse en la lógica del dominio.

3.5.  Stack tecnológico

Las siguientes secciones describen el stack tecnológico adoptado para el prototipo. Las de-
cisiones reflejan el resultado del análisis realizado durante el Sprint 1 y quedan documentadas
en detalle en el Capítulo 4.

3.5.1.  Capa blockchain: red y framework de desarrollo

Para el desarrollo de los contratos inteligentes se propone trabajar sobre la red Ethereum.
La elección de Ethereum se justifica por ser la plataforma de referencia para contratos inteli-
gentes, con el ecosistema de herramientas, documentación y comunidad más maduro disponi-
ble (Buterin, 2014). El ciclo de desarrollo y las pruebas unitarias y de integración se ejecutan
sobre Hardhat  Network, el nodo Ethereum local que incorpora el propio framework de
desarrollo,  que  permite  iterar  sin  costes  de  red  ni  tiempos  de  confirmación.  El  despliegue
definitivo del prototipo se realiza en la testnet pública Sepolia al final del Sprint 9, como
paso previo a la entrega, para que el evaluador pueda verificar los contratos en un explorador
de bloques público sin necesidad de reproducir el entorno local.

Como alternativa a considerar durante el Sprint 1 se contempla Polygon PoS, una red
compatible con la EVM que reduce el coste de las transacciones en varios órdenes de magnitud
respecto a la red principal de Ethereum, lo que puede resultar relevante para un prototipo
con un volumen significativo de operaciones de registro.

Para  el  entorno  de  desarrollo  local,  compilación  y  pruebas  de  contratos  inteligentes  se

propone Hardhat, por las siguientes razones:

• Ecosistema maduro con amplia documentación y soporte de la comunidad.

• Flujo  de  trabajo  en  JavaScript/TypeScript,  coherente  con  el  backend  y  el  frontend

propuestos.

• Hardhat Network: nodo Ethereum local para pruebas que permite simular condiciones
de red, manipular el estado de la cadena e inspeccionar el coste de gas de cada operación.

• Integración nativa con las principales bibliotecas del ecosistema (ethers.js, OpenZeppe-

lin, Chai).

Como biblioteca de contratos auditados y reutilizables se propone OpenZeppelin Con-
tracts, que proporciona implementaciones de referencia para patrones de control de acceso,

22

Metodología

gobernanza y gestión de roles que pueden adaptarse al mecanismo de reputación de NewsEra,
reduciendo el riesgo de introducir vulnerabilidades en código crítico.

3.5.2.  Capa de backend

Se emplea Node.js con TypeScript como entorno de ejecución, y Hono como frame-
work web. Hono es un framework ultraligero y de alto rendimiento, con soporte nativo de
TypeScript, un modelo de rutas y middleware equivalente al de Express pero con una API más
ergonómica y sin configuración adicional. Hono se ha consolidado como uno de los frameworks
más adoptados para nuevas APIs REST en el entorno JavaScript moderno.

Para el acceso a la base de datos se utiliza Prisma ORM, que genera tipos TypeScript
automáticamente  a  partir  del  esquema  de  la  base  de  datos  y  gestiona  las  migraciones  de
forma integrada. El almacenamiento off-chain del contenido completo de las publicaciones
y  sus  metadatos  se  realiza  en  PostgreSQL,  base  de  datos  relacional  con  soporte  nativo
para tipos JSON y búsqueda de texto completo. Cada registro incluye como campo clave el
hash del contenido registrado en la blockchain, garantizando la trazabilidad verificable entre
almacenamiento off-chain y registro on-chain.

Para la interacción con los contratos inteligentes desde el servidor se utiliza la biblioteca
viem, elegida por su tipado estático completo en TypeScript y su rendimiento generalmente
superior en operaciones de decodificación de ABI respecto a ethers.js.

Para el almacenamiento descentralizado del contenido completo de los artículos se utiliza
IPFS  (InterPlanetary  File  System)  a  través  del  servicio  de  pinning  Pinata.  Cuando  un
usuario publica un artículo, el frontend sube el contenido a IPFS mediante la API de Pinata
y  obtiene  un  CID  único  que  identifica  ese  contenido  de  forma  permanente  y  verificable.
Este CID se almacena en el campo ipfsCid del modelo de datos off-chain. A diferencia de
almacenar el contenido en PostgreSQL, IPFS garantiza que el cuerpo del artículo no depende
de un servidor centralizado para su disponibilidad.

3.5.3.  Capa de frontend

Se emplea React con Vite como bundler, configurando la aplicación como una SPA (Single
Page Application) con renderizado en el cliente. La elección de este modelo frente a Next.js
—considerado en fases previas del diseño— responde a un criterio de alineación con el prin-
cipio KISS: en una aplicación Web3 donde la práctica totalidad de las vistas requieren acceso
a  la  cartera  del  usuario,  la  distinción  entre  Server  Components  y  Client  Components  del
App Router de Next.js añade una capa de complejidad arquitectónica sin aportar beneficio
significativo. React con Vite ofrece un modelo mental más simple, tiempos de compilación
más cortos y una experiencia de depuración más directa, factores especialmente valiosos en
el contexto de un proyecto académico individual.

Para la navegación entre páginas se utiliza React Router v6, solución de enrutamiento
de referencia en el ecosistema React para aplicaciones de tipo SPA. Los estilos se implemen-
tan con Tailwind CSS, un framework de utilidades CSS que permite construir interfaces
sin  escribir  hojas  de  estilo  personalizadas.  La  biblioteca  de  componentes  de  referencia  es
shadcn/ui, una colección de componentes de código abierto construidos sobre Radix UI y
Tailwind CSS que el desarrollador incorpora directamente al repositorio, sin dependencia de
un paquete externo.

3.6.  Estrategia de validación

23

Para la interacción con la blockchain desde el frontend se emplea wagmi v2 junto con viem,
que ofrecen hooks de React con tipado estático completo para las operaciones de lectura y
escritura en contratos. La UX de conexión de cartera se gestiona a través de RainbowKit,
que proporciona un componente de conexión compatible con MetaMask, WalletConnect y
otras carteras habituales del ecosistema Ethereum con una integración mínima de código.
Toda la interacción con la blockchain y con la API del servidor ocurre íntegramente en el
cliente, mediante hooks de React y fetch nativo, sin lógica de negocio delegada al servidor
de frontend.

3.5.4.  Herramientas de desarrollo y control de versiones

El entorno de desarrollo utiliza las siguientes herramientas:

• Visual  Studio  Code como IDE, con las extensiones de Solidity, ESLint y Prettier

para el análisis estático y el formateo consistente del código.

• Git  y  GitHub  para  el  control  de  versiones.  El  repositorio  de  implementación  del

prototipo es público y está disponible en:

https://github.com/jrdj1/NewsEra

• Chai como biblioteca de aserciones para las pruebas de contratos inteligentes, integrada

en el entorno Hardhat.

• Vitest para las pruebas unitarias del backend y los componentes del frontend: ofre-
ce  compatibilidad  completa  con  la  API  de  Jest  pero  con  soporte  nativo  de  ESM  y
TypeScript y una velocidad de ejecución significativamente superior.

• Bruno para el desarrollo y prueba manual de los endpoints de la API REST: cliente
HTTP de código abierto que almacena las colecciones de peticiones en el repositorio
como archivos de texto plano, a diferencia de Postman, que las gestiona en la nube.

• Docker y Docker Compose para el despliegue del entorno local. La base de datos
PostgreSQL y cualquier servicio auxiliar se ejecutan como contenedores definidos en un
archivo docker-compose.yml en la raíz del repositorio. Esto garantiza que el entorno de
desarrollo es reproducible en cualquier máquina sin necesidad de instalar ni configurar
manualmente los servicios de base de datos.

• Pinata como servicio de pinning para IPFS. El contenido completo de los artículos se
almacena en la red IPFS mediante la API de Pinata, que ofrece un nivel gratuito sufi-
ciente para el prototipo. El CID (Content Identifier) asignado por IPFS a cada artículo
se registra en el modelo de datos off-chain y sirve como referencia de almacenamiento
descentralizado del contenido completo.

3.6.  Estrategia de validación

La validación del prototipo se articuló en cinco niveles complementarios, con el objetivo de

demostrar el cumplimiento de los objetivos específicos OE3, OE4 y OE7:

24

Metodología

3.6.1.  Pruebas unitarias de contratos inteligentes

Cada función de los contratos inteligentes fue sometida a un conjunto de pruebas auto-
matizadas que cubren los siguientes escenarios: el camino feliz (happy path), las condiciones
de contorno y los intentos de uso indebido que el contrato rechaza mediante errores perso-
nalizados. Se estableció como umbral mínimo una cobertura del 80 % de las instrucciones;
el resultado final superó ese umbral en todos los contratos (ver Capítulo 5). Las pruebas se
ejecutaron sobre Hardhat Network y se automatizaron en el pipeline de integración continua
del repositorio de GitHub.

3.6.2.  Pruebas de escenario del mecanismo de gobernanza

Dado que el mecanismo de reputación y gobernanza es el componente nuclear del sistema
(OE4), se diseñaron pruebas de escenario específicas que simulan situaciones de uso adverso:

• Ataque  Sybil:  un  actor  intenta  crear  múltiples  cuentas  para  acumular  reputación
artificial.  El  sistema  detecta  y  penaliza  este  comportamiento  mediante  la  puerta  de
entrada por reputación mínima (MIN_REPUTATION_TO_VALIDATE).

• Validador malicioso: un validador emite sistemáticamente juicios contrarios al con-
senso de la comunidad. El mecanismo degrada su reputación hasta excluirlo del proceso
de validación.

• Colusión de validadores: un grupo de validadores coordina sus votos para validar
contenido falso. El diseño incorpora el mecanismo de reapertura por rondas como sal-
vaguarda ante esta amenaza.

• Validador honesto bajo presión: un validador con buena reputación enfrenta con-
tenido  ambiguo.  El  sistema  se  comporta  de  forma  predecible  y  justa,  ajustando  la
reputación retroactivamente según el veredicto final consolidado.

3.6.3.  Análisis de coste de gas

Cada operación de los contratos inteligentes tiene un coste en gas que determina su via-
bilidad económica en la red real. Se midió el coste de las operaciones principales —registro
de publicación, emisión de verificación, actualización de reputación— y se compararon con
los umbrales habituales en la red Ethereum. Los resultados de este análisis se recogen en el
Capítulo 5.

3.6.4.  Evaluación de viabilidad del sistema

Al concluir los sprints de implementación de contratos se llevó a cabo una evaluación cuali-
tativa y cuantitativa orientada a responder la pregunta central del trabajo: ¿es técnicamente
viable construir una plataforma de información descentralizada resistente a la captura por
grupos de poder? Esta evaluación contempló:

• El grado de cumplimiento de cada objetivo específico (OE1–OE7).

3.6.  Estrategia de validación

25

• Las limitaciones técnicas identificadas durante el desarrollo (escalabilidad, coste, usa-

bilidad).

• La comparación entre las propiedades del sistema y las de las soluciones centralizadas

equivalentes.

• Las condiciones sociales y técnicas necesarias para que el sistema pueda operar en un

entorno real.

3.6.5.  Experimentos de validación con usuarios

Los  cuatro  niveles  anteriores  validan  que  el  sistema  funciona  correctamente  y  de  forma
segura, pero no responden a una pregunta distinta y igualmente necesaria: si el problema que
motiva el proyecto es percibido como real por sus destinatarios, y si la solución propuesta
resulta  comprensible  y  utilizable  para  ellos.  Siguiendo  la  metodología  de  experimentación
propia de Lean Startup (Ries, 2011), se diseñaron dos experimentos independientes, cada uno
con una hipótesis, un Minimum Viable Product (MVP) y un criterio de éxito definidos de
antemano.

Experimento 1: intensidad del problema

Hipótesis. Una  proporción  significativa  de  los  usuarios  de  redes  sociales  y  consumidores
habituales de noticias online perciben la desinformación como un problema grave en su
consumo de información, y no disponen de un método fiable para verificarla.

MVP. Encuesta estructurada, sin exposición previa al prototipo ni a ninguna solución con-
creta, para evitar sesgar la percepción del problema con la propia respuesta propuesta.

Instrumento. Preguntas en escala Likert de 5 puntos sobre frecuencia de exposición a con-
tenido dudoso, confianza en las fuentes de información actuales, experiencia previa de
haber compartido o creído contenido posteriormente desmentido, y disponibilidad de
un método propio de verificación.

Criterio de éxito. Al menos el 60 % de las respuestas califica el problema como grave o
muy grave (4 o 5 en la escala), y al menos el 50 % declara no disponer de un método
fiable de verificación en la actualidad.

Experimento 2: idoneidad del producto

Hipótesis. Al interactuar con el prototipo funcional, los usuarios comprenden la propuesta
de valor de NewsEra, perciben el mecanismo de consenso comunitario como confiable,
y expresarían disposición a utilizar la plataforma.

MVP. El  propio  prototipo  desplegado,  en  su  estado  funcional  real  —no  una  maqueta  ni
una simulación—: los participantes interactúan con los flujos principales (consultar el
feed, publicar un artículo, validar contenido) sobre la aplicación completa descrita en el
Capítulo 4.

26

Metodología

Instrumento. Cuestionario posterior a la interacción que combina el System Usability Scale
(Brooke,  1996)  —diez  ítems  estandarizados,  puntuación  de  0  a  100—  con  preguntas
específicas sobre claridad de la propuesta de valor, confianza percibida en el mecanismo
de consenso e intención de uso futura.

Criterio de éxito. Puntuación SUS media igual o superior a 68 —el umbral de referencia
habitual para considerar “aceptable” la usabilidad de un sistema (Brooke, 1996)— y al
menos el 60 % de los participantes expresa intención de uso.

Ambos experimentos son complementarios: el primero valida que el problema existe con
independencia de la solución concreta; el segundo, que la solución construida resulta compren-
sible y utilizable para resolverlo. Un resultado positivo en el primero y negativo en el segundo
apuntaría a un problema de diseño de interfaz, no de planteamiento del proyecto —distin-
ción relevante para orientar el trabajo futuro—. Las limitaciones propias de una muestra de
conveniencia, de tamaño reducido y no representativa de la población general, se discuten en
el §6.3 junto con el resto de limitaciones del trabajo. El contenido íntegro de ambos bloques
de preguntas, listo para su implementación, se recoge en el Anexo B; los resultados obtenidos
al ejecutarlos se recogen en el Capítulo 5.

3.7.  Gestión de riesgos

Todo proyecto de desarrollo de software incorpora incertidumbres que deben ser identifica-
das y gestionadas de forma proactiva. La Tabla 3.2 recoge los riesgos principales identificados
para este proyecto, junto con su probabilidad estimada, su impacto y la estrategia de miti-
gación propuesta.

3.7.  Gestión de riesgos

27

Riesgo

Prob.

Impacto Mitigación

Tabla 3.2: Registro de riesgos del proyecto.

Complejidad mayor de lo prevista
en los contratos de gobernanza

Alta

Alto

Reducir el alcance del OE4 al pro-
totipo  mínimo  viable;  delegar  la
gobernanza compleja a trabajo fu-
turo

Coste de gas inviable en Ethereum
mainnet

Media

Medio

Evaluar  Polygon  PoS  o  Layer  2
como alternativa en Sprint 1

Vulnerabilidades  de  seguridad  en
los contratos

Media

Alto

Cambios en las APIs o herramien-
tas del ecosistema blockchain

Baja

Medio

Desviación  temporal  en  algún
sprint

Alta

Bajo

Uso  de  OpenZeppelin,  pruebas
exhaustivas  y  revisión  del  código
con herramientas de análisis está-
tico (Slither)

Fijar  versiones  de  dependencias;
seguir  el  changelog  de  Hardhat  y
ethers.js

Reducir el alcance del sprint afec-
tado y redistribuir tareas no críti-
cas al backlog

4.  Diseño del sistema

Este capítulo presenta el diseño arquitectónico de NewsEra resultante del Sprint 1. Cons-
tituye  el  documento  de  diseño  que  articula  las  decisiones  tomadas  sobre  la  estructura  del
sistema antes de la implementación: qué componentes existen, qué responsabilidades tiene
cada uno, cómo se comunican entre sí y qué datos almacena cada capa. El diseño toma como
punto  de  partida  los  objetivos  específicos  OE2–OE5  definidos  en  el  Capítulo  1  y  el  stack
tecnológico seleccionado en el Capítulo 3.

La arquitectura de NewsEra responde a un principio central: las reglas del sistema —quién
puede publicar, cómo se valida el contenido, cómo se acumula y pierde reputación— se codifi-
can en contratos inteligentes públicos e inmutables desplegados en la blockchain de Ethereum.
Ningún actor puede modificarlas unilateralmente. El resto del sistema —backend, base de
datos, interfaz de usuario— existe para hacer ese núcleo accesible y usable, pero no puede
subvertir sus reglas (Buterin, 2014).

El código fuente completo del prototipo —contratos inteligentes, backend y frontend— está

disponible públicamente en el repositorio de GitHub del proyecto:

https://github.com/jrdj1/NewsEra

4.1.  Especificación de requisitos

Antes de abordar el diseño arquitectónico, esta sección recoge la Especificación de Requi-
sitos de Software (ERS) elaborada durante el Sprint 1, siguiendo la estructura de contenidos
recomendada por el estándar (Institute of Electrical and Electronics Engineers, 1998): el ca-
tálogo de casos de uso que debe soportar el prototipo, organizado en un sistema de temas
(STQR), funcionalidades de alto nivel (FEAT) y casos de uso concretos (UC), junto con los
requisitos no funcionales, de datos y de interfaz que condicionan su implementación. El resto
del capítulo desarrolla el diseño técnico que satisface estos requisitos.

4.1.1.  Casos de uso

Todos los casos de uso del prototipo se agrupan bajo un único sistema temático, STQR 1.
Sistema de publicación y verificación de contenidos, dividido en cinco funcionalidades
de alto nivel. La Tabla 4.1 resume el alcance de cada una.

4.1.1.1.  FEAT 1. Gestión de cuenta

En NewsEra no existe un sistema de cuentas tradicional con credenciales: la cartera co-
nectada es la cuenta. Sin cartera conectada, el sistema ofrece un perfil público limitado a las
funcionalidades de solo lectura de FEAT 3 (Explorar contenido); conectar la cartera desblo-
quea las siguientes funcionalidades:

29

30

Diseño del sistema

Tabla 4.1: Funcionalidades de alto nivel (FEAT) de STQR 1 y sus casos de uso.

FEAT Nombre

FEAT 1 Gestión de cuenta
FEAT 2 Publicar artículo
FEAT 3 Explorar contenido
FEAT 4 Verificar artículo
FEAT 5

Información institucional

• UC 1. Conectar cartera.

Casos de uso

UC 1–11
UC 12–19
UC 20–31
UC 32–40
UC 41–42

• UC 2. Actualizar / modificar datos del perfil enriquecido (nombre, avatar, email op-

cional).

• UC 3. Revisar artículos guardados como favoritos.

• UC 4. Revisar artículos publicados propios.

• UC 5. Revisar votaciones anteriores (ganadoras, perdedoras, sin resolver, y métricas

de acierto).

• UC 6. Revisar reputación actual.

• UC 7. Revisar evolución histórica de la reputación.

• UC 8. Reclamar reputación neta (retroactiva).

• UC 9. Revisar solicitudes de reapertura realizadas.

• UC 10. Consultar notificaciones.

• UC 11. Desconectar cartera.

4.1.1.2.  FEAT 2. Publicar artículo

• UC 12. Redactar artículo siguiendo la plantilla estándar de redacción, común a todas

las publicaciones.

• UC 13. Guardar borrador antes de confirmar la publicación.

• UC 14. Etiquetar el artículo por categoría o temática.

• UC 15. Enlazar otros artículos de NewsEra mediante hipervínculos internos.

• UC 16. Incluir referencias bibliográficas.

• UC 17. Consultar vista previa del artículo antes de confirmar.

• UC 18. Consultar el contentHash calculado antes de firmar la transacción.

• UC 19. Confirmar la publicación on-chain firmando la transacción con la cartera.

4.1.  Especificación de requisitos

31

Autoría y fecha de publicación no se modelan como casos de uso independientes: son atri-
butos generados automáticamente por el sistema como efecto de UC 19 (autoría = dirección
que firma la transacción; fecha = timestamp del bloque), no acciones que el actor inicie de
forma separada.

4.1.1.3.  FEAT 3. Explorar contenido

Es la única funcionalidad accesible sin cartera conectada:

• UC 20. Consultar el feed de artículos recientes.

• UC 21. Buscar / filtrar artículos por estado de consenso, etiquetas o autor.

• UC 22. Ver el detalle de un artículo (contenido y metadatos).

• UC 23. Ver el estado de consenso del artículo.

• UC 24. Ver el recuento de votos del artículo.

• UC 25. Consultar el ranking de validadores por reputación.

• UC 26. Consultar el perfil público de una dirección (reputación, historial de validación

y artículos publicados).

• UC 27. Acceder a la verificación del artículo.

• UC 28. Ordenar los resultados del feed o la búsqueda.

• UC 29. Seguir un artículo para recibir notificaciones de cambios de estado.

• UC 30. Compartir un artículo mediante enlace directo.

• UC 31. Guardar o quitar un artículo de favoritos.

4.1.1.4.  FEAT 4. Verificar artículo

Concentra las herramientas que apoyan la decisión de un validador antes y durante el voto,

además de las acciones que exigen cartera conectada y reputación suficiente:

• UC 32. Consultar la bibliografía y los enlaces internos citados por el artículo.

• UC 33. Comparar el artículo con otros de NewsEra sobre el mismo tema.

• UC 34. Consultar el historial de rondas anteriores y su resultado.

• UC 35. Votar el artículo (TRUE / FALSE / UNVERIFIABLE).

• UC 36. Solicitar la reapertura de un artículo concluido.

• UC 37. Reclamar reputación retroactiva sobre el artículo.

• UC 38. Ver el progreso hacia el quórum (votos emitidos frente a los necesarios para

cerrar la ronda).

32

Diseño del sistema

• UC 39. Consultar qué validadores ya han votado en la ronda actual.

• UC 40. Ver el efecto reputacional estimado antes de votar.

4.1.1.5.  FEAT 5. Información institucional

• UC 41. Consultar la landing page (propuesta de valor y tres pilares del proyecto).

• UC  42. Consultar  la  página  “Sobre  el  proyecto” (funcionamiento,  descripción  de  la
Decentralized  Autonomous  Organization  (DAO)  y  enlace  público  a  la  memoria  del
Trabajo Fin de Grado (TFG)).

La gobernanza descentralizada mediante una DAO plenamente operativa — votación de
propuestas, gestión de roles vía interfaz de usuario— queda fuera del alcance de STQR 1 y
se documenta como línea de trabajo futuro (§6.4), no como un caso de uso del prototipo.

4.1.2.  Casos de uso detallados

El desarrollo completo de los 42 casos de uso —actor, precondiciones, flujo principal, flujos
alternativos y postcondiciones— se recoge en el Anexo A para no interrumpir la narrativa de
diseño de este capítulo. Los seis casos de uso que implican una transacción on-chain o una
verificación criptográfica, y que por tanto concentran la complejidad funcional del sistema,
son: UC 1 (Conectar cartera), UC 2 (Actualizar datos del perfil), UC 19 (Confirmar publi-
cación on-chain), UC 35 (Votar artículo), UC 36 (Solicitar reapertura) y UC 37 (Reclamar
reputación retroactiva).

4.1.3.  Requisitos no funcionales

Rendimiento.

• RNF 1. El coste de gas de las operaciones on-chain (registerPublication, submitValidation,

requestReopen, claimRetroactiveReputation) debe mantenerse dentro de límites
razonables mediante Tight Variable Packing [objetivo de diseño; verificación empírica
prevista en Sprint 5/8].

• RNF 2. El tiempo de confirmación de una transacción está condicionado por el tiempo
de bloque de la red ( 12 s en Sepolia); la interfaz debe reflejar estados de espera sin
bloquear la interacción.

Seguridad.

• RNF 3. Ningún componente del sistema almacena ni gestiona claves privadas del usua-
rio; toda firma se realiza desde su cartera, gestionada mediante wagmi y RainbowKit.

• RNF 4. El backend no firma transacciones en nombre de ningún usuario.

• RNF  5.  Los  contratos  deben  superar  un  análisis  estático  (Slither)  sin  findings  de

severidad High/Critical.

4.1.  Especificación de requisitos

33

• RNF 6. El control de acceso a funciones sensibles se implementa mediante AccessControl

(roles), nunca mediante comprobaciones ad-hoc.

• RNF  7.  Transparencia.  Las  reglas  de  publicación,  validación  y  reputación  están
codificadas en contratos públicos y verificables en Etherscan; cualquier persona puede
auditar el código fuente y el estado on-chain sin depender de un intermediario.

• RNF 8. Inmutabilidad. Una vez registrado un contentHash o emitido un voto, no
puede alterarse ni eliminarse: los contratos no exponen funciones de borrado ni edición
sobre datos ya confirmados.

• RNF 9. Descentralización. Ningún actor único controla el resultado del consenso:
el backend nunca firma transacciones y la lógica de consenso reside íntegramente en los
contratos. El almacenamiento en IPFS vía Pinata introduce un punto de centralización
parcial en el pinning — si el contenido no ha sido replicado por otros nodos, su dispo-
nibilidad depende de ese servicio, aunque el contentHash on-chain permite verificar la
integridad de cualquier copia recuperada.

• RNF 10. Resistencia a la captura. Los parámetros de gobernanza (quorumThreshold,
superMajorityBps, reopenThreshold) se fijan en el constructor sin funciones de mo-
dificación posterior al despliegue.

• RNF 11. Auditabilidad. Toda acción relevante emite un evento on-chain que permite

reconstruir el historial completo del sistema sin acceso privilegiado.

• RNF 12. Trazabilidad. Toda acción queda vinculada a una dirección pública y a un

bloque con marca de tiempo verificable.

Usabilidad.

• RNF 13. La interfaz debe ser legible y funcional en dispositivos móviles.

• RNF 14. Todo estado de carga y error debe comunicarse explícitamente al usuario,

sin pantallas en blanco.

• RNF 15. El perfil enriquecido (UC 2) no debe exigir contraseña; la propiedad de la

dirección se verifica mediante personal_sign.

Mantenibilidad.

• RNF 16. Separación estricta de capas en el backend: enrutador → servicio → reposi-

torio; el enrutador no accede directamente a Prisma.

• RNF 17. Las carpetas blockchain, backend y frontend son proyectos independien-

tes, sin workspaces ni monorepo.

• RNF 18. Toda interacción con la blockchain, en backend y frontend, se realiza mediante

viem — nunca ethers.js — para mantener un cliente único y consistente.

• RNF 19. El backend se implementa con Hono como framework HTTP, TypeScript en

modo estricto y módulos ESM nativos, sin CommonJS.

34

Diseño del sistema

• RNF 20. Las pruebas manuales de la API se realizan con Bruno, no con herramientas

equivalentes como Postman.

Portabilidad / compatibilidad.

• RNF 21. El backend requiere Node.js 20 LTS y PostgreSQL 16 vía Docker, con Prisma

como ORM.

• RNF 22. El frontend debe operar contra red local (Hardhat Network) y Sepolia sin

cambios de código, solo de configuración de wagmi.

• RNF 23. Los contratos deben ser compatibles con Solidity ^0.8.20, Hardhat ^2.22 y
OpenZeppelin Contracts ^5.x, desplegables tanto en Hardhat Network como en Ethe-
reum Sepolia.

• RNF 24. El frontend se implementa como SPA con React + Vite, React Router v6,

Tailwind CSS v4 y shadcn/ui sobre Radix UI.

Escalabilidad.

• RNF  25. El  diseño  prioriza  la  simplicidad  (KISS)  frente  a  la  escalabilidad  de  pro-
ducción: docker-compose es suficiente para el prototipo; no se requiere orquestación
(Kubernetes).

Cumplimiento / privacidad.

• RNF 26. El email opcional del perfil enriquecido (UC 2) es un dato personal; su alma-
cenamiento debe ser opt-in explícito y no condicionar el acceso a ninguna funcionalidad.

Cobertura de pruebas.

• RNF 27. Cobertura de tests de los contratos inteligentes ≥ 80 % (npx hardhat coverage),

con Chai para contratos y Vitest para backend y frontend.

4.1.4.  Requisitos de datos

Principios generales.

• RD 1. La blockchain es la única fuente de verdad para autoría, contentHash, votos,
estado de consenso por ronda y reputación. PostgreSQL almacena una réplica de solo
lectura poblada por el indexador de eventos, nunca al revés.

• RD 2. El contentHash vincula la entidad on-chain (Publication en PublicationRegistry)

con su réplica off-chain y con el contenido almacenado en IPFS.

• RD 3. Toda escritura on-chain debe reflejarse en PostgreSQL a través del indexador

de eventos, no mediante escritura directa del frontend a la base de datos.

Publicación (Publication).

• RD 4. On-chain: author, timestamp, exists — inmutable, indexado por contentHash.

4.1.  Especificación de requisitos

35

• RD 5. Off-chain: title, body, authorAddress, tags[], ipfsCid, consensusState,

currentRound, reopenRequestCount, createdAt.

• RD 6. El body almacenado en PostgreSQL debe satisfacer keccak256(body) == contentHash;

cualquier discrepancia invalida el registro como corrupto.

• RD 7. tags es una lista de cadenas libres definida por el autor al publicar (UC 14).

Rondas de validación (Round).

• RD 8. Cada publicación tiene 𝑁  rondas, cada una con round, state, result, completed.

• RD  9. Una  vez  completed = true,  los  campos  state y  result de  esa  ronda  son

inmutables.

Validaciones (Validation).

• RD 10. Cada voto: contentHash, validatorAddress, vote, round, txHash, createdAt.

• RD  11.  Restricción  de  unicidad:  un  validatorAddress solo  puede  votar  una  vez
por  artículo,  independientemente  de  la  ronda;  el  voto  es  vinculante  para  las  rondas
posteriores salvo reclamación retroactiva (UC 37).

Validador / reputación (Validator).

• RD  12. On-chain:  reputación  y  estado  de  registro,  gestionados  exclusivamente  por

ReputationSystem.

• RD  13.  Off-chain:  address (clave  primaria),  reputationScore,  lastSyncBlock,

registeredAt, updatedAt.

• RD 14. reputationScore off-chain debe ser una réplica exacta del valor on-chain en
todo momento; cualquier desincronización se resuelve reindexando desde lastSyncBlock.

Reapertura y reclamación retroactiva.

• RD 15. ReopenRequest: contentHash, requesterAddress, count, txHash, createdAt

— único por (contentHash, requesterAddress).

• RD 16. RetroactiveClaim: contentHash, validatorAddress, netDelta, txHash,

claimedAt — único por (contentHash, validatorAddress, txHash).

Perfil enriquecido (UserProfile) — solo off-chain.

• RD 17. address (clave primaria), displayName, avatarUrl, email (opcional, opt-in),

updatedAt.

• RD 18. No existe contraseña ni credencial almacenada; toda modificación requiere una

firma válida (personal_sign) de la dirección propietaria.

Favoritos (Favorite) — solo off-chain.

36

Diseño del sistema

• RD 19. userAddress, contentHash, createdAt — único por (userAddress, contentHash),

sin contrapartida on-chain.

Notificaciones (Notification) — solo off-chain.

• RD 20. userAddress, contentHash, type (REOPENED / CONSENSUS_REACHED / RETROACTIVE_APPLIED),

read (por defecto false), createdAt.

• RD  21.  Poblada  por  el  indexador  de  eventos  en  el  mismo  punto  en  que  procesa
VotingReopened, ConsensusReached y RetroactiveClaimed para los artículos que
el usuario sigue o votó; no se calcula bajo demanda.

• RD 22. Sin contrapartida on-chain; editable por su propietario (marcar como leída). Se
recomienda purgar notificaciones leídas con antigüedad superior a un umbral razonable,
para evitar el crecimiento indefinido de la tabla [nota de diseño, no bloqueante para el
prototipo].

Retención e integridad.

• RD 23. Ningún dato on-chain puede eliminarse ni editarse una vez confirmado (RNF 8).

• RD 24. Los datos exclusivamente off-chain (perfil enriquecido, favoritos, notificaciones)
sí son editables o eliminables por su propietario, ya que no forman parte del protocolo
de consenso.

4.1.5.  Requisitos de interfaz

Interfaz de usuario.

• RI 1. Navegación mediante rutas de SPA (React Router v6): /, /publish, /article/:hash,

/validators, /validators/:address, /profile, /about.

• RI  2. Cabecera  fija  global  con  logo,  navegación  y  ConnectButton de  RainbowKit,

visible en todas las rutas.

• RI  3. Plantilla  estándar  de  redacción  para  artículos  (UC  12):  todos  los  artículos  se

renderizan con el mismo formato visual, independientemente del autor.

• RI 4. Diseño responsive, legible en dispositivos móviles (RNF 13).

• RI 5. Estados de carga y error explícitos en toda vista que dependa de datos remotos,

sea del backend o de la blockchain (RNF 14).

• RI 6. Toda acción que requiera firma de cartera muestra el hash de transacción y su
estado (pendiente / confirmada / fallida) mediante useWaitForTransactionReceipt.

• RI 7. Los errores de revert conocidos del contrato (InsufficientReputation, AlreadyValidated,

VotingNotOpen, ReopenNotAvailable, AlreadyRequestedReopen, NothingToClaim)
se traducen a mensajes en lenguaje natural; nunca se muestra el error crudo de Solidity
al usuario.

4.2.  Visión general de la arquitectura

37

Interfaces externas.

• RI 8. Interfaz con la cartera del usuario vía wagmi + RainbowKit (MetaMask, Wallet-

Connect).

• RI 9. Interfaz con la blockchain vía viem, contra Hardhat Network o Ethereum Sepolia

según la configuración de red activa.

• RI 10. Interfaz con IPFS a través de la API de Pinata, para subida y recuperación del

contenido de los artículos.

• RI 11. Interfaz REST entre frontend y backend bajo /api/v1, formato JSON, con es-

tructura de error uniforme {"error": {"code", "message"}}. Códigos: NOT_FOUND
(404), CONFLICT (409), UNPROCESSABLE (422), FORBIDDEN (403), UNAUTHORIZED (401
— credenciales de servicio ausentes o inválidas, usado en POST /api/v1/sync/events)
e INTERNAL_ERROR (500).

• RI 12. Interfaz de verificación pública de los contratos desplegados en el explorador de

bloques Etherscan (Sepolia).

4.2.  Visión general de la arquitectura

El sistema NewsEra se estructura en tres capas con responsabilidades claramente diferen-
ciadas: la capa on-chain, la capa off-chain y la capa de presentación. Esta separación refleja
una distinción fundamental entre los datos que deben ser verificables e inmutables —y por
tanto viven en la blockchain— y los datos que no requieren esa garantía pero sí eficiencia en
la consulta —y por tanto viven en una base de datos relacional convencional.

4.2.1.  Capa on-chain: la fuente de verdad

La capa on-chain está formada por tres contratos inteligentes escritos en Solidity y des-
plegados en la testnet Ethereum Sepolia. Esta capa almacena exclusivamente los datos que
requieren garantías de inmutabilidad y verificabilidad pública: huellas digitales (hashes) de
publicaciones, votos de validación y puntuaciones de reputación de los validadores. No alma-
cena el cuerpo completo de los artículos: el coste de almacenamiento en cadena hace inviable
guardar texto extenso, y en cualquier caso la inmutabilidad del hash es suficiente para ga-
rantizar la integridad del contenido (Ding et al., 2023).

Las reglas  de  gobernanza  del sistema  —cuántos votos forman  quórum, cuánto aumenta
o disminuye la reputación tras cada validación, qué umbral mínimo de reputación permite
validar— están codificadas directamente en los contratos. Su modificación requeriría un nuevo
despliegue, lo que exige consenso y transparencia.

4.2.2.  Capa off-chain: eficiencia y consultabilidad

La capa off-chain está formada por un servidor backend construido con Node.js, TypeScript
y el framework Hono, y una base de datos PostgreSQL accedida mediante el ORM Prisma.
Esta capa almacena el contenido completo de las publicaciones, sus metadatos y un índice
para la búsqueda y el filtrado eficiente.

38

Diseño del sistema

El backend actúa también como indexador de eventos de la blockchain: escucha en tiempo
real los eventos emitidos por los contratos (PublicationRegistered, ValidationSubmitted,
ReputationUpdated) y actualiza la base de datos para mantener una réplica consistente del
estado on-chain. Esta réplica acelera las consultas del frontend y evita que cada petición de
lectura tenga que interrogar directamente a la blockchain.

La independencia entre capas garantiza que, si la base de datos off-chain se corrompe o se
pierde, el estado completo del sistema puede reconstruirse relanzando el indexador contra el
historial de eventos registrado en la cadena.

4.2.3.  Capa de presentación: la interfaz Web3

La capa de presentación es una aplicación React con Vite como bundler, que implemen-
ta el patrón SPA (Single Page Application) con renderizado completamente en cliente. La
elección de React+Vite sobre Next.js responde a la filosofía KISS adoptada en el proyecto
(§3.4): en una aplicación Web3 donde la práctica totalidad de las vistas requieren acceso a
la cartera del usuario, la distinción Server/Client Components de Next.js App Router aña-
de complejidad conceptual sin aportar beneficio significativo. React+Vite ofrece un modelo
mental más simple, compilación incremental más rápida y depuración más directa. El en-
rutamiento se gestiona con React Router v6. Los componentes de interfaz utilizan Tailwind
CSS y shadcn/ui. La interacción con los contratos inteligentes y la cartera se implementa
mediante wagmi v2, viem y RainbowKit, que son independientes del framework de frontend.

La aplicación expone siete rutas principales que cubren los flujos de uso fundamentales:
/ (portada  con  listado  de  artículos  y  su  estado  de  validación),  /publish (formulario  de
publicación de nuevo contenido),  /article/:hash (detalle de artículo con panel de vota-
ción para validadores), /validators (directorio de validadores con ranking de reputación),
/validators/:address (perfil público de validador con historial), /profile (perfil propio
con estado de reputación y cartera conectada), y /about (información sobre el proyecto y
enlace a la memoria).

La Figura 4.1 muestra los wireframes de las vistas principales del prototipo.

4.2.4.  El hash criptográfico como vínculo entre capas

El elemento que mantiene la coherencia entre la capa on-chain y la off-chain es el hash
criptográfico del contenido de cada publicación. Cuando un usuario publica un artículo, el
frontend calcula el hash keccak256 del cuerpo del artículo antes de enviarlo a ningún servidor.
Ese  hash  se  registra  en  la  blockchain  como  identificador  permanente  e  inmutable  de  esa
publicación.  A  continuación,  el  contenido  completo  se  envía  al  backend,  que  lo  almacena
vinculado a ese mismo hash.

Cualquier actor puede, en cualquier momento, calcular el hash del contenido que obtiene
del backend y compararlo con el registrado en la cadena. Si coinciden, el contenido no ha sido
modificado. Si no coinciden, el backend ha sido manipulado —lo que es detectable de forma
independiente, sin necesidad de confiar en ninguna entidad (Nakamoto, 2008).

4.2.  Visión general de la arquitectura

39

[PENDIENTE: capturas/mockups de la interfaz]

Deben incluirse capturas de pantalla del prototipo funcional o, en su defecto,
wireframes de las siguientes vistas:

• Portada (/): listado de artículos con indicadores visuales de su estado de

consenso (PENDING / DEFINITIVE / DISPUTED), puntuación de
reputación del autor y botón de conexión de cartera.

• Detalle de artículo (/article/:hash): cuerpo del artículo, historial de
votos emitidos (dirección del validador, tipo de voto), panel de votación
(TRUE / FALSE / UNVERIFIABLE) para usuarios con reputación
suficiente, y resultado del consenso si ya se ha alcanzado.

• Publicar artículo (/publish): formulario con título, contenido y

etiquetas; previsualización del hash keccak256 calculado localmente antes
de firmar la transacción.

• Perfil de validador (/validators/:address): puntuación de

reputación actual, historial de validaciones con resultado de cada una, y
evolución temporal de la reputación.

Figura  4.1:  Mockup  de  las  vistas  principales  de  la  interfaz  de  NewsEra.  La  interfaz  per-
mite  a  cualquier  usuario  publicar  contenido  y  consultar  validaciones;  para  emitir  votos  se
requiere conectar una cartera MetaMask y tener reputación mínima acreditada en el contra-
to ReputationSystem.

40

Diseño del sistema

4.2.5.  Esquema global del sistema

La Figura 4.2 muestra el esquema completo de NewsEra con sus tres capas y los flujos
de interacción principales. El diagrama debe representar los tres bloques verticales (capa de
presentación, capa off-chain y capa on-chain), los componentes principales de cada uno, y
las flechas de comunicación: usuario → SPA → API → blockchain para escrituras; eventos
on-chain → indexador → PostgreSQL → SPA para lecturas.

[PENDIENTE: diagrama de arquitectura del sistema]

El diagrama debe mostrar:

• Tres capas diferenciadas: presentación (React/Vite SPA), off-chain (Hono
API + Prisma + PostgreSQL + IPFS/Pinata) y on-chain (Ethereum
Sepolia).

• Los tres contratos inteligentes en la capa on-chain:

PublicationRegistry, ValidationRegistry y ReputationSystem, con
sus relaciones de dependencia.

• El flujo de escritura: usuario firma transacción en MetaMask → SPA envía

tx → nodo Ethereum → contratos actualizan estado.

• El flujo de lectura: eventos on-chain → indexador backend → PostgreSQL

→ consultas REST desde la SPA.

• El hash keccak256 como elemento de vinculación entre capas.

• IPFS/Pinata como almacenamiento descentralizado del cuerpo de los

artículos, con el CID referenciado en PostgreSQL.

Figura 4.2: Arquitectura global del sistema NewsEra: capas y flujos de interacción. El conteni-
do de los artículos se almacena en IPFS; los registros de publicación, validación y reputación,
en los contratos inteligentes; los metadatos e índices, en PostgreSQL; la interfaz de usuario
interactúa con las tres capas.

4.2.6.  Distribución de datos entre capas

La Tabla 4.2 resume qué datos residen en cada capa del sistema y el motivo de esa distri-

bución.

4.2.  Visión general de la arquitectura

41

Tabla 4.2: Distribución de datos entre las capas del sistema NewsEra.

Dato

Capa

Motivo

Hash de publicación (bytes32)

Dirección del autor y timestamp

On-chain  (Publica-
tionRegistry)

On-chain  (Publica-
tionRegistry)

Votos de validación (dirección, tipo, timestamp) On-chain  (Valida-

Puntuación de reputación por dirección

Cuerpo del artículo

Metadatos y CID de IPFS

Índice de búsqueda y filtros por etiqueta

Réplica de reputación y votos (cache)

Historial de transacciones (tx_hash)

tionRegistry)
On-chain
tationSystem)

(Repu-

Off-chain (IPFS vía
Pinata)

Off-chain
greSQL)

Off-chain
greSQL)

Off-chain
greSQL)

Off-chain
greSQL)

(Post-

(Post-

(Post-

(Post-

inalte-

Inmutabilidad y ve-
rificabilidad  públi-
ca
Atribución
rable
Historial  auditable
de cada validador
La  reputación  no
puede  ser  alterada
por el backend
Almacenamiento
descentralizado;
CID  registrado  en
BD
Índice  consultable;
reconstructible des-
de eventos on-chain
Consultas  comple-
jas
en
inviables
EVM
Acelerar  consultas;
reconstructible des-
de eventos
Enlace
auditable
entre  evento  on-
chain  y
registro
off-chain

42

Diseño del sistema

4.3.  Diseño de los contratos inteligentes

El núcleo de NewsEra se articula en tres contratos inteligentes con responsabilidades bien

delimitadas.

STICKY-NOTE  ¿Verifican los contratos la veracidad automáticamente? Una pregunta natural al leer
este diseño es si los contratos inteligentes determinan automáticamente si una noticia
es  verdadera  o  falsa.  La  respuesta  es  no:  los  contratos  no  tienen  acceso  a  fuentes  ex-
ternas  de  información  ni  pueden  razonar  sobre  el  contenido  de  los  artículos.  Lo  que
ValidationRegistry hace es agregar los juicios emitidos por validadores humanos y
aplicar las reglas de consenso de forma determinista e inmutable. El contrato responde
a la pregunta «¿cuántos validadores votaron cada opción y se ha alcanzado supermayo-
ría?», no a «¿es este artículo verdadero?». La veracidad es un juicio humano; el contrato
garantiza que ese juicio colectivo no pueda ser manipulado por ningún actor una vez
emitido. Esta distinción es fundamental para comprender los límites y el valor real del
sistema.

Este diseño aplica el principio de separación de responsabilidades (Separation of Concerns)
al nivel de los contratos, siguiendo los patrones de modularidad recomendados para sistemas
de contratos en producción (Ding et al., 2023). Cada contrato expone una API mínima hacia
el exterior y delega en los demás únicamente a través de interfaces explícitas, lo que facilita
el análisis de seguridad y la actualización futura de componentes individuales.

Los tres contratos utilizan la biblioteca OpenZeppelin Contracts como base para los pa-
trones de control de acceso. En concreto, AccessControl de OpenZeppelin se emplea para
restringir qué contratos pueden llamar a las funciones sensibles de ReputationSystem: solo
ValidationRegistry tiene el rol VALIDATOR_ROLE que le permite modificar puntuaciones
de reputación. Esta restricción impide que cualquier actor externo, incluido el propietario del
contrato, manipule directamente las puntuaciones (Feichtinger et al., 2023).

4.3.1.  PublicationRegistry

PublicationRegistry es el contrato responsable del registro inmutable de publicaciones.
Su función es simple y su superficie de ataque mínima: cualquier dirección Ethereum puede
registrar una publicación proporcionando el hash keccak256 de su contenido. El contrato alma-
cena la tripla (contentHash, author, timestamp) y emite el evento PublicationRegistered
para que los sistemas off-chain puedan indexarlo.

El diseño es deliberadamente minimalista. El contrato no valida el contenido ni restringe
quién puede publicar: la apertura a la publicación es un principio fundamental del sistema.
Lo que garantiza el contrato es que, una vez registrado un hash, ese registro es permanente
e inmutable: nadie puede eliminarlo ni modificar la autoría o el momento de publicación.

BOOK Diseño: PublicationRegistry

Almacenamiento: mapping(bytes32 => Publication) donde  Publication es  un
struct con author (address), timestamp (uint256) y exists (bool).

4.3.  Diseño de los contratos inteligentes

43

Función  principal:  registerPublication(bytes32 contentHash) —  visibilidad
external. Revierte si el hash ya está registrado.
Evento:
indexed author, uint256 timestamp).
Función  de  consulta:  getPublication(bytes32 contentHash)  —  visibilidad
external view. Devuelve la struct completa.

PublicationRegistered(bytes32 indexed contentHash, address

ValidationRegistry consulta getPublication para conocer al autor de un artículo en
el momento de aplicar la recompensa por publicación (§4.3.2); esta es la única dependencia
de PublicationRegistry hacia otro contrato del sistema, y es de solo lectura.

4.3.2.  ValidationRegistry

ValidationRegistry gestiona el proceso de validación de publicaciones a lo largo de múl-
tiples rondas de votación. El contrato verifica que cada validador tiene reputación suficiente,
registra su voto y evalúa el consenso al alcanzar el quórum. A diferencia de un sistema de
única ronda, el diseño contempla la reapertura del proceso cuando suficientes validado-
res nuevos solicitan revisar un veredicto existente, permitiendo que el conocimiento colectivo
evolucione con nueva evidencia.

Cada voto puede ser de uno de tres tipos: TRUE (el contenido es veraz), FALSE (el contenido
es falso o engañoso) o UNVERIFIABLE (el validador no puede determinar la veracidad con la
evidencia disponible).

Voto plano con acceso gated

Todos los votos de validadores acreditados computan con el mismo peso, con independen-
cia de su reputación acumulada. Esta decisión preserva la independencia epistémica de
cada juicio: el incentivo racional de cada validador es evaluar el artículo con su propio criterio,
porque su voto tiene el mismo impacto que el de cualquier otro. La resistencia Sybil la propor-
ciona el umbral mínimo de reputación para acceder al rol de validador —las cuentas nuevas
no pueden votar—, sin necesidad de asignar pesos diferenciales. El razonamiento completo
de esta decisión, incluyendo las alternativas consideradas, se expone en la Sección 5.5.

UNVERIFIABLE como veredicto de primera clase

El tipo de voto UNVERIFIABLE no es una abstención: computa en el cálculo del consenso,
puede constituir el resultado definitivo de una ronda si obtiene supermayoría, y acarrea las
mismas consecuencias reputacionales que cualquier otro voto incorrecto respecto al consenso
final. Esta decisión elimina el incentivo a usarlo como opción dominante de riesgo cero. El
razonamiento completo se expone en la Sección 5.5.

Umbrales de certeza: quórum y supermayoría

El mecanismo de consenso opera con dos umbrales independientes:

44

Diseño del sistema

1. Quórum mínimo (quorumThreshold): número mínimo de votos que debe alcanzar
una ronda para que el contrato evalúe si hay consenso. Por debajo de este umbral la
publicación permanece en estado PENDING.

2. Supermayoría (superMajorityBps): porcentaje mínimo que debe acumular la opción
ganadora  sobre  el  total  de  votos  de  la  ronda  para  que  el  consenso  sea  definitivo.  Se
expresa  en  puntos  básicos  (6667  =  66,67 %).  Si  se  alcanza  el  quórum  pero  ninguna
opción obtiene supermayoría, el resultado es DISPUTED.

Mecanismo de reapertura por rondas

Una  vez  concluida  una  ronda  (estado  DEFINITIVE o  DISPUTED),  el  proceso  de  valida-
ción no queda permanentemente cerrado. Cualquier validador con reputación suficiente que
aún  no  haya  votado  ese  artículo  puede  registrar  una  solicitud  de  reapertura mediante
la función requestReopen. Cuando el número de solicitudes acumuladas alcanza el umbral
reopenThreshold, el contrato abre automáticamente una nueva ronda de votación: el estado
pasa a PENDING y los solicitantes —y cualquier otro validador nuevo— pueden emitir su voto.
Este mecanismo implementa el principio de supervivencia del veredicto propuesto por Adler
y de Alfaro (2007) en el contexto de Wikipedia: la calidad de un juicio no se mide únicamente
por su acuerdo con la mayoría en el momento en que se emite, sino por su capacidad de resistir
el escrutinio de nuevos participantes independientes a lo largo del tiempo. En NewsEra, un
veredicto que sobrevive múltiples rondas de desafío acumula evidencia progresiva de solidez;
uno que es revertido por nuevas rondas revela que el conocimiento disponible ha evolucionado.

La Figura 4.3 muestra la máquina de estados resultante del mecanismo de rondas.

[PENDIENTE: diagrama de máquina de estados de
ValidationRegistry]

PENDING

PENDING

N votos, supermayoría
−−−−−−−−−−−−−−→ DEFINITIVE
N votos, sin supermayoría
−−−−−−−−−−−−−−−−→ DISPUTED

N solicitudes
−−−−−−−−→ PENDING (nueva ronda)

N solicitudes
−−−−−−−−→ PENDING (nueva ronda)

Los votos de cada ronda son independientes e inmutables.
Las solicitudes de reapertura quedan registradas en cadena.

Figura  4.3:  Máquina  de  estados  de  ValidationRegistry.  El  estado  PENDING_REOPEN es
transitorio: se activa internamente cuando se alcanza reopenThreshold solicitudes y se re-
suelve de forma inmediata al abrir la nueva ronda.

Efectos reputacionales: ronda propia y reputación retroactiva

El sistema de reputación opera en dos niveles complementarios.
Efectos de la ronda propia (aplicados inmediatamente al cerrar cada ronda):

4.3.  Diseño de los contratos inteligentes

45

• Consenso DEFINITIVE: los validadores que votaron la opción ganadora reciben +REPUTATION_REWARD

(+5); los que votaron cualquier otra opción reciben -REPUTATION_PENALTY (−3).

• Consenso DISPUTED: no se modifica la reputación de ningún participante. El sistema

reconoce que no hubo certeza suficiente.

Reputación retroactiva (modelo pull, reclamada por el validador):
Cada vez que cierra una nueva ronda sobre un artículo, los resultados de esa ronda revelan
información sobre la calidad de los juicios emitidos en rondas anteriores. Un validador puede
llamar a claimRetroactiveReputation para recibir los ajustes acumulados desde su ronda
hasta la más reciente:

• Si la nueva ronda confirma el resultado de tu ronda: los que acertaron en su ronda

reciben +RETROACTIVE_DELTA (+1); los que fallaron reciben −1.

• Si la nueva ronda contradice el resultado de tu ronda: los que acertaron en su ronda

reciben −1; los que fallaron reciben +1 (reivindicación parcial).

• Cap retroactivo: el efecto acumulado queda limitado a ±RETROACTIVE_CAP (±3) por

artículo, independientemente del número de rondas.

El modelo pull —en lugar de aplicar los ajustes automáticamente— es una decisión deli-
berada de diseño: si el contrato iterara sobre todos los validadores históricos al cerrar cada
nueva ronda, el coste de gas escalaría de forma proporcional al número total de participantes
en el artículo, pudiendo resultar prohibitivo en artículos con muchas rondas. Con el modelo
pull, el validador activa el cálculo cuando lo desee, pagando únicamente el gas de sus propios
ajustes.

La Tabla 4.3 resume todos los escenarios posibles.

Tabla  4.3:  Efectos  reputacionales  completos  en  ValidationRegistry.  Los  efectos
de  ronda  propia  se  aplican  al  cerrar  cada  ronda;  los  retroactivos,  al  llamar  a
claimRetroactiveReputation (máximo ±3 acumulados).

Momento

Situación

Condición

Efecto

Ronda propia DEFINITIVE
Ronda propia DEFINITIVE
Ronda propia DISPUTED

Votaste la opción ganadora
Votaste otra opción
Cualquier voto

Retroactivo
Retroactivo
Retroactivo
Retroactivo

Ronda N confirma tu ronda
Ronda N confirma tu ronda
Ronda N contradice tu ronda Acertaste en tu ronda
Ronda N contradice tu ronda Fallaste en tu ronda

Acertaste en tu ronda
Fallaste en tu ronda

+5
−3
0

+1
−1
−1
+1

Recompensa por publicación

Además  de  los  efectos  sobre  quienes  votan,  la  primera  vez  que  la  ronda  de  un  artículo
alcanza  DEFINITIVE el  contrato aplica  un  efecto  reputacional  al  autor de  la  publicación,
obtenido de PublicationRegistry.getPublication(contentHash).author:

46

Diseño del sistema

• Resultado TRUE: el autor recibe +PUBLISH_REPUTATION_REWARD (+8).

• Resultado UNVERIFIABLE: el autor recibe -PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE

(−8) — publicó una afirmación que la comunidad no pudo confirmar ni refutar.

• Resultado FALSE: el autor recibe -PUBLISH_REPUTATION_PENALTY_FALSE (−15), la

penalización más severa del sistema, reservada para el contenido probado falso.

• Consenso DISPUTED: sin efecto sobre el autor, igual que para los votantes.

Este efecto se aplica una sola vez por artículo — reaperturas posteriores (VotingReopened)
no vuelven a evaluarlo— y se calcula en el mismo punto donde ya se resuelven los efectos de
los votantes de la ronda, sin introducir un recorrido adicional sobre la lista de validadores:
el coste de gas de leer un único autor es constante, a diferencia del recorrido acotado que sí
requiere el cálculo de la reputación retroactiva.

A diferencia de los efectos sobre los votantes, esta recompensa invierte la proporción re-
ward:penalty (los validadores tienen 5:3; aquí es 8:15) de forma deliberada: el problema que
NewsEra aborda es la desinformación en el origen, no solo su detección, por lo que publicar
contenido probado falso debe costar sensiblemente más que el beneficio de publicar contenido
veraz.

Predicciones: acceso guiado sin publicar

El umbral mínimo de reputación para votar (MIN_REPUTATION_TO_VALIDATE en ReputationSystem)

plantea un problema de arranque: ninguna dirección nueva puede acumular reputación vo-
tando, porque no puede votar sin reputación previa. La única vía de entrada hasta ahora
era el registro manual del administrador (registerValidator) o publicar un artículo que
alcance consenso TRUE. Para ofrecer una vía adicional, sin publicar nada, el contrato expone
submitPrediction(bytes32 contentHash, uint8 vote):

• Solo puede invocarla una dirección con canValidate(msg.sender) == false — una
vez alcanzado el umbral, la dirección debe usar submitValidation, no este canal pa-
ralelo.

• Solo sobre un artículo cuyo estado ya sea DEFINITIVE — es decir, un artículo que la
comunidad ya resolvió como TRUE, FALSE o UNVERIFIABLE. Revierte si el artículo está
PENDING o  DISPUTED:  no  hay  todavía  una  respuesta  fijada  contra  la  que  evaluar  la
predicción.

• Una dirección solo puede predecir una vez sobre cada artículo.

• La resolución es inmediata y síncrona, en la misma transacción: se compara el voto

con rounds[contentHash][currentRound].result y se aplica al instante +PREDICTION_REWARD
(+1) si coincide o -PREDICTION_PENALTY (−1) si no. No depende del consenso en curso
de ningún otro artículo ni se resuelve junto con nadie: es asíncrona respecto a cualquier
votación real de la red.

4.3.  Diseño de los contratos inteligentes

47

STICKY-NOTE  Una rampa de acceso guiada, no una prueba de criterio Puesto que el artículo objetivo
ya está resuelto de forma pública e inmutable en el momento de predecir, cualquier direc-
ción puede consultar la respuesta correcta antes de responder y acertar siempre. Ocultar
el resultado en la interfaz no cambiaría esto: el dato sigue siendo legible directamente
del contrato por cualquiera con conocimiento técnico mínimo, así que ocultarlo solo en-
gañaría al usuario casual sin proteger nada real. Por ello, el mecanismo se documenta
explícitamente como lo que es: una rampa  de  acceso  guiada  y  deliberadamente
accesible, no una prueba de criterio bajo incertidumbre — coherente con el principio
de apertura ya aplicado a la publicación (§4.3.1). Su único límite natural es que cada
artículo solo sirve una vez por dirección, y por tanto está acotado por cuántos artículos
ya alcanzaron DEFINITIVE en un momento dado.

Fundamento epistemológico del consenso

El diseño anterior descansa en una postura epistemológica explícita que conviene enunciar

antes de pasar a ReputationSystem.

Verdad operacional, no verdad absoluta. NewsEra no pretende descubrir la verdad
objetiva de un artículo. Lo que el sistema produce es un veredicto comunitario verificable:
la  opinión  agregada  de  un  conjunto  de  validadores  con  historial  probado,  expresada  on-
chain,  resistente  a  la  manipulación  retrospectiva  y  auditable  por  cualquier  persona.  Este
veredicto puede coincidir con la verdad factual, pero su valor estructural reside en que ningún
actor puede manipularlo unilateralmente ni borrarlo, no en que sea infalible. El quórum y la
supermayoría —definidos arriba— son las condiciones de representatividad y certeza colectiva
que  operacionalizan  esa  noción  de  veredicto;  UNVERIFIABLE es,  dentro  de  ese  marco,  un
reconocimiento legítimo de que la evidencia disponible no permite zanjar la cuestión.

DISPUTED como reconocimiento de la controversia. Cuando el quórum se alcanza
pero  ninguna  opción  obtiene  supermayoría,  el  sistema  no  elige  al  ganador  por  diferencia
mínima ni penaliza a nadie. El estado DISPUTED expresa que la comunidad está genuinamente
dividida. Esta etiqueta es informativa por sí sola: un artículo marcado como controvertido
transmite al lector una señal distinta a uno marcado como TRUE, FALSE o UNVERIFIABLE.
No toda ausencia de consenso es equivalente a falsedad o a inverificabilidad.

BOOK Diseño: ValidationRegistry

por

ronda:

Enumeraciones:  VoteType { TRUE, FALSE, UNVERIFIABLE } y  ConsensusState
{ PENDING, DEFINITIVE, DISPUTED, PENDING_REOPEN }.
mapping(bytes32 => mapping(uint256 =>
Almacenamiento
RoundInfo)) public rounds donde RoundInfo contiene result, state y completed.
mapping(bytes32 => uint256) public currentRound  y  mapping(bytes32 =>
mapping(uint256 => uint256)) public roundVoteCount (votos por artículo y por
ronda).
Almacenamiento  por  votante:  mapping(bytes32 => mapping(address =>
VoteType)) private _vote
mapping(bytes32 => mapping(address =>
uint256)) public voterRound (inmutables una vez emitidos).

y

48

Diseño del sistema

principales:

submitValidation(bytes32, uint8)  —

emite
Funciones
voto  en  la  ronda  actual;  requestReopen(bytes32)  —  registra  solicitud  de
reapertura;  si  reopenRequestCount >= reopenThreshold,  abre  nueva  ronda;
claimRetroactiveReputation(bytes32) —  aplica  ajustes  retroactivos  de  rondas
posteriores  a  la  del  votante;  submitPrediction(bytes32, uint8)  —  registra  y
resuelve  de  forma  inmediata  una  predicción  sobre  un  artículo  ya  DEFINITIVE,  para
direcciones con canValidate == false.
Parámetros de gobernanza (constructor): quorumThreshold, superMajorityBps,
reopenThreshold.
Dependencias  de  contrato:  IReputationSystem  (efectos  de  reputación)  y
PublicationRegistry (consulta del autor para la recompensa por publicación).
Constantes:
RETROACTIVE_DELTA=1,
PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE=8, PUBLISH_REPUTATION_PENALTY_FALSE=15,
PREDICTION_REWARD=1, PREDICTION_PENALTY=1.
ConsensusReached(…,
Eventos:
uint256 round),  ReopenRequested(…),  VotingReopened(…, uint256 newRound),
RetroactiveClaimed(…, int256 netDelta),
PredictionSubmitted(bytes32
indexed contentHash, address indexed predictor, uint8 vote, uint256
round).

REPUTATION_PENALTY=3,
PUBLISH_REPUTATION_REWARD=8,

REPUTATION_REWARD=5,
RETROACTIVE_CAP=3,

ValidationSubmitted(…, uint256 round),

4.3.3.  ReputationSystem

ReputationSystem es  el  componente  central  del  sistema  (OE4).  Gestiona  las  puntua-
ciones  de  reputación  de  todos  los  validadores,  controla  qué  direcciones  tienen  acceso  al
rol  de  validador  y  expone  las  funciones  de  modificación  de  reputación  exclusivamente  a
ValidationRegistry, usando AccessControl de OpenZeppelin para imponer esa restric-
ción en el propio contrato.

El diseño del mecanismo de reputación sigue el patrón de stake-based reputation: la repu-
tación se acumula participando correctamente y se pierde votando contra el consenso. No
puede comprarse, transferirse ni delegarse: solo se obtiene mediante participación verificable
y honesta (Messias et al., 2023). La integración de DIDs y VCs del W3C (World Wide Web
Consortium, 2022) —solución de nivel de producción para la resistencia Sybil descrita en el
§2.5— queda diferida como trabajo futuro dado que su implementación completa excede el
alcance del prototipo actual, que adopta la reputación acumulativa como primera barrera de
acceso. Este diseño es inherentemente resistente a ataques Sybil en el sentido siguiente: crear
múltiples cuentas no proporciona ventaja porque cada cuenta comienza con reputación cero
—insuficiente para validar— y debe acumular reputación de forma independiente a través de
un historial verificable de participación.

Los validadores se incorporan al sistema con una puntuación de reputación inicial confi-
gurada  por  el  administrador  del  contrato,  que  actúa  como  mecanismo  de  arranque  inicial
(bootstrapping): los primeros validadores del sistema son designados manualmente, y a partir
de  ahí  el  mecanismo  de  reputación  opera  de  forma  completamente  autónoma.  Este  es  un

4.3.  Diseño de los contratos inteligentes

49

compromiso de diseño habitual en sistemas de gobernanza descentralizada de nueva creación
(Feichtinger et al., 2023).

BOOK Diseño: ReputationSystem

Almacenamiento  (privado):  mapping(address => uint256) _reputation  y
mapping(address => bool) _registered. El acceso externo se realiza mediante las
funciones de lectura getReputation e isRegisteredValidator.
Rol de control de acceso: bytes32 public constant VALIDATOR_ROLE. Solo las di-
recciones con este rol (asignado a ValidationRegistry en el despliegue) pueden llamar
a increaseReputation y decreaseReputation.
y
Funciones
canValidate(address validator)  —  devuelven  la  puntuación  y  si  supera  el
umbral mínimo.
increaseReputation(address
Funciones
escritura
de
validator, uint256 amount)
decreaseReputation(address validator,
uint256 amount) — solo invocable por ValidationRegistry mediante el control de
acceso basado en roles.
Evento:  ReputationUpdated(address indexed validator, uint256 newScore,
bool increased).

(restringidas):
y

getReputation(address validator)

lectura:

de

INFO-CIRCLE  Resistencia a ataques Sybil del mecanismo de reputación Un ataque Sybil consiste
en crear múltiples identidades falsas para obtener una influencia desproporcionada en el
sistema. En NewsEra, este ataque es estructuralmente ineficaz por dos razones:

1. La reputación inicial de cualquier dirección nueva es cero, insuficiente para partici-
par como validador. No existe un camino rápido para adquirir reputación sin pasar
por un proceso de participación progresiva y verificable.

2. Cada voto de validación queda registrado permanentemente en la cadena, vincu-
lado  a  una  dirección  Ethereum.  El  historial  de  participación  de  cada  dirección
es público y auditable, lo que desincentiva el comportamiento oportunista: votar
aleatoriamente o de forma coordinada contra el consenso degrada la reputación de
todas las cuentas implicadas.

Este diseño contrasta con los sistemas de reputación basados en token weighting, en los
que la reputación puede comprarse directamente en el mercado, creando un vector de
ataque financiero (Feichtinger et al., 2023).

4.3.4.  Tabla de funciones principales de los contratos

La Tabla 4.4 resume las funciones de la API pública de los tres contratos.

50

Diseño del sistema

Tabla 4.4: Funciones principales de los contratos inteligentes de NewsEra.

Contrato

Función

Visibilidad

Descripción

PublicationRegistry

registerPublication

external

PublicationRegistry

getPublication

external view

Registra el hash
de una publica-
ción nueva
Devuelve  autor
y timestamp de
un hash dado

ValidationRegistry

submitValidation

external

ValidationRegistry

getVote

external view

ValidationRegistry

hasVoted

external view

ValidationRegistry

getRoundVoters

external view

ValidationRegistry

requestReopen

external

ValidationRegistry

claimRetroactiveReputation

external

ValidationRegistry

submitPrediction

external

ReputationSystem

getReputation

external view

ReputationSystem

canValidate

external view

ReputationSystem

increaseReputation

external (rol)

ReputationSystem

decreaseReputation

external (rol)

Registra
un
voto  de  vali-
dación;  calcula
consenso si hay
quórum
Devuelve
el
tipo  de  voto  y
la  ronda  de  un
validador
en
una publicación
si
Comprueba
una  dirección
ya ha votado en
alguna ronda
Devuelve la lis-
ta  de  votantes
de  una  ronda
concreta
Registra
licitud
reapertura;
si  se  alcanza
reopenThreshold,
inicia
ronda
Aplica  ajustes
retroactivos  de
reputación  de
rondas  poste-
riores  a  la  del
votante
Predicción
sobre
artículo
DEFINITIVE,
resuelta
al
instante (solo si
canValidate
== false)

so-
de

un
ya

nueva

la
Devuelve
puntuación  de
reputación  de
una dirección
Indica si una di-
rección  supera

el umbral míni-

mo

Aumenta

la

reputación  de

un

validador

(solo  Valida-

tionRegistry)

Disminuye

la

reputación  de

un

validador

(solo  Valida-

tionRegistry)

nuevo validador

con  reputación

inicial

ReputationSystem

registerValidator

external (admin)

Incorpora

un

4.4.  Modelo de datos

51

4.4.  Modelo de datos

4.4.1.  Almacenamiento on-chain

Las estructuras de datos on-chain están diseñadas para minimizar el consumo de gas, al-
macenando únicamente los datos estrictamente necesarios para garantizar la inmutabilidad
e integridad del sistema. En Solidity, cada slot de almacenamiento ocupa 32 bytes; el empa-
quetado eficiente de variables de menor tamaño en un mismo slot es una técnica habitual de
optimización de gas (Ding et al., 2023).

El Fragmento de código 4.4.1 muestra las estructuras de datos principales de los contratos

ValidationRegistry y ReputationSystem.

Estructuras de datos on-chain (Solidity)

1 // SPDX-License-Identifier: MIT
2 pragma solidity ^0.8.20;
3
4 // --- PublicationRegistry ---
5 struct Publication {
6

7

address author;
uint96 timestamp;
bool

exists;

// 20 bytes
// 12 bytes (packed with author)
// 1 byte   (packed in same slot)

8
9 }
10 mapping(bytes32 => Publication) public publications;
11
12 // --- ValidationRegistry ---
13 enum VoteType
14 enum ConsensusState { PENDING, DEFINITIVE, DISPUTED, PENDING_REOPEN }
15
16 struct RoundInfo {
VoteType
17
ConsensusState state;
bool

{ TRUE, FALSE, UNVERIFIABLE }

completed;

result;

18

19
20 }
21
22 mapping(bytes32 => ConsensusState) public consensusState;
23 mapping(bytes32 => uint256)
24 mapping(bytes32 => uint256)
25
26 // --- ReputationSystem ---
27 mapping(address => uint256) private _reputation;
28 mapping(address => bool)
private _registered;
29 uint256 public constant MIN_REPUTATION_TO_VALIDATE = 10;
30 uint256 public constant REPUTATION_REWARD
= 5;
31 uint256 public constant REPUTATION_PENALTY
= 3;

public currentRound;
public reopenRequestCount;

El  empaquetado  de  address (20  bytes)  con  uint96 (12  bytes)  en  un  único  slot  de  32
bytes reduce el coste de escritura en almacenamiento en aproximadamente un 50% respecto a
almacenar ambos en slots separados, siguiendo la práctica recomendada por el patrón Tight
Variable Packing (Ding et al., 2023). Los mappings bidimensionales de ValidationRegistry

52

Diseño del sistema

—indexados por contentHash y por número de ronda— se describen en el §4.3.2.

4.4.2.  Esquema off-chain (PostgreSQL / Prisma)

La base de datos off-chain almacena el contenido completo de las publicaciones y mantiene
una réplica del estado on-chain para acelerar las consultas. El esquema se define mediante
Prisma ORM, que genera los tipos TypeScript a partir de la definición del modelo y gestiona
las migraciones.

El  campo  contentHash es  el  vínculo  entre  ambas  capas:  actúa  como  clave  única  en  la
tabla publications y como clave foránea lógica en validations. Su presencia en ambos
lados garantiza que cualquier registro off-chain puede ser verificado contra la blockchain en
tiempo constante. El campo ipfsCid almacena el identificador de contenido (CID) devuelto
por Pinata tras la subida del artículo a IPFS; su carácter opcional (String?) permite que
registros creados por el indexador a partir de eventos on-chain queden sin CID hasta que el
frontend complete el paso de escritura en la API.

Esquema Prisma (schema.prisma)

1 datasource db {
2

 provider = "postgresql"
 url

 = env("DATABASE_URL")

3
4 }
5
6 generator client {
7
8 }
9
10 model Publication {
11

 provider = "prisma-client-js"

 Int

 id
 contentHash   String
 String
 title
 body
 String
 authorAddress  String
 tags
 ipfsCid
 createdAt
 validations   Validation[]
 reopenRequests ReopenRequest[]

 String[]
 String?
 DateTime

 @@map("publications")

22
23 }
24
25 model Validation {
26

 Int
 id
 contentHash
 String
 validatorAddress String
 String
 vote
 Int
 round
 String?
 txHash

12

13

14

15

16

17

18

19

20

21

27

28

29

30

31

 @id @default(autoincrement())
 @unique

 @default(now())

 @id @default(autoincrement())

 @default(0)

4.4.  Modelo de datos

53

 createdAt
 publication

 DateTime   @default(now())
 Publication @relation(fields: ..., references: ...)

 @@unique([contentHash, validatorAddress])
 @@map("validations")

36
37 }
38
39 model Validator {
40

 String   @id

 address
 @default(0)
 reputationScore Int
 lastSyncBlock   BigInt   @default(0)
 updatedAt

 DateTime @updatedAt

 @@map("validators")

La restricción @@unique([contentHash, validatorAddress]) en el modelo Validation

impide que el backend registre más de un voto por validador y publicación, replicando la in-
variante del contrato. El campo round registra en qué ronda de votación se emitió cada voto,
permitiendo al indexador reconstruir el historial multironda.

Los modelos ReopenRequest y RetroactiveClaim persisten off-chain los eventos corres-
pondientes a requestReopen y claimRetroactiveReputation, con restricciones de unici-
dad que replican las del contrato:

Modelos adicionales en schema.prisma

 @id @default(autoincrement())

 String?
 DateTime   @default(now())
 Publication @relation(fields: ..., references: ...)

1 model ReopenRequest {
2

 Int
 id
 contentHash
 String
 requesterAddress String
 txHash
 createdAt
 publication

10
11 }
12
13 model RetroactiveClaim {
14

 Int
 id
 contentHash
 String
 validatorAddress String
 netDelta
 txHash
 createdAt

 @@unique([contentHash, requesterAddress])
 @@map("reopen_requests")

 @id @default(autoincrement())

 Int
 String?
 DateTime @default(now())

 @@unique([contentHash, validatorAddress, txHash])
 @@map("retroactive_claims")

32

33

34

35

41

42

43

44

45
46 }

3

4

5

6

7

8

9

15

16

17

18

19

20

21

22
23 }

54

Diseño del sistema

El perfil enriquecido, los favoritos y las notificaciones (RD 17–RD 22) no tienen contrapar-
tida on-chain: son datos exclusivamente off-chain que el usuario gestiona directamente, sin
pasar por el indexador de eventos.

Modelos sin contrapartida on-chain (schema.prisma)

1 model UserProfile {
2

 String   @id

 address
 displayName String?
 avatarUrl   String?
 email
 String?
 updatedAt   DateTime @updatedAt

3

4

5

6

7

 @@map("user_profiles")

8
9 }
10
11 model Favorite {
12

 Int

 id
 userAddress String
 contentHash String
 createdAt   DateTime @default(now())

 @id @default(autoincrement())

 @@unique([userAddress, contentHash])
 @@map("favorites")

18
19 }
20
21 model Notification {
22

 Int

 id
 userAddress String
 contentHash String
 type

 @id @default(autoincrement())

 String   // REOPENED | CONSENSUS_REACHED |

RETROACTIVE_APPLIED

↪
 read
 Boolean  @default(false)
 createdAt   DateTime @default(now())

 @@map("notifications")

13

14

15

16

17

23

24

25

26

27

28

29
30 }

4.4.3.  Sincronización on-chain → off-chain

El backend mantiene la base de datos off-chain sincronizada con el estado on-chain me-
diante un indexador de eventos. El indexador utiliza la función watchContractEvent de la
biblioteca viem para suscribirse en tiempo real a los tres eventos relevantes de los contratos:

• PublicationRegistered: cuando se emite este evento, el indexador crea o actualiza
el registro correspondiente en la tabla publications de PostgreSQL, actualizando el
campo authorAddress con la dirección del autor registrada en cadena.

• ValidationSubmitted: el indexador registra el nuevo voto en la tabla validations,

incluyendo el txHash de la transacción para trazabilidad.

4.5.  Diseño de la API REST

55

• ReputationUpdated: el indexador actualiza el campo reputationScore del validador

correspondiente en la tabla validators y registra el lastSyncBlock del evento.

Este diseño garantiza que el backend puede reconstruirse completamente desde cero relan-
zando el indexador contra el historial de eventos on-chain, desde el bloque de despliegue de
los contratos hasta el bloque actual. La base de datos off-chain es, en todo momento, una
vista derivada del estado on-chain, no una fuente de verdad independiente (Mazzocca et al.,
2025).

4.5.  Diseño de la API REST

4.5.1.  Arquitectura de capas del backend

El backend se organiza en tres capas internas con responsabilidades bien delimitadas:

• Capa  de  enrutamiento  (Router  Hono): recibe  las  peticiones  HTTP,  valida  los
parámetros de entrada y delega la lógica de negocio a la capa de servicios. No accede
directamente a la base de datos.

• Capa de servicios (Services): contiene la lógica de negocio: cálculo de hashes, or-
questación de consultas, transformación de datos entre el formato de la blockchain (hex,
wei, etc.) y el formato de la API (JSON, strings). Tampoco accede directamente a la
base de datos.

• Capa de repositorios (Repositories / Prisma): encapsula todos los accesos a Post-
greSQL. Cada repositorio expone métodos tipados en TypeScript para las operaciones
CRUD de cada modelo, evitando que la lógica SQL se disperse por el código.

Esta separación facilita las pruebas unitarias de la capa de servicios mediante la inyección

de repositorios simulados (mocks), sin necesidad de una base de datos real.

Exclamation-Triangle  Distinción crítica: escrituras on-chain vs off-chain Las operaciones de escritura en la
blockchain (registerPublication, submitValidation) las ejecuta el frontend direc-
tamente contra los contratos, utilizando la cartera del usuario como firmante. El backend
no firma transacciones en nombre del usuario: no tiene acceso a su clave privada y
no debe tenerlo. El rol del backend es únicamente indexar los eventos resultantes de esas
transacciones y servir el contenido off-chain a través de la API.

4.5.2.  Endpoints de la API

Los  endpoints  de  la  API REST  se  agrupan  en  tres  recursos  principales:  publicaciones,

validadores y sincronización interna.

56

Diseño del sistema

GET

/api/v1/publications

Lista  publicaciones  con  filtros  opcionales  por  etiqueta,  autor  y  estado  de  validación.  Soporta
paginación mediante los parámetros page y limit.

GET

/api/v1/publications/:hash

Devuelve  el  detalle  completo  de  una  publicación  identificada  por  su  contentHash:  cuerpo  del
artículo, autor, timestamp, lista de validaciones y estado de consenso actual.

POST

/api/v1/publications

Registra  el  contenido  completo  de  una  publicación  ya  registrada  on-chain.  El  cliente  envía  el
cuerpo del artículo; el backend verifica que el hash del cuerpo recibido coincide con el contentHash
indicado (que debe existir en la blockchain) y lo almacena en PostgreSQL.

GET

/api/v1/validators/:address

Devuelve el perfil de un validador: dirección, puntuación de reputación (sincronizada desde on-
chain), número total de validaciones y porcentaje de aciertos sobre el consenso.

GET

/api/v1/validators/:address/history

Devuelve el historial de validaciones emitidas por un validador, con el resultado de cada voto, si
coincidió con el consenso final y el impacto en su reputación.

GET

/api/v1/validators

Lista los validadores registrados ordenados por puntuación de reputación descendente. Útil para
el panel de ranking de la interfaz.

4.6.  Diseño de la interfaz de usuario

57

POST

/api/v1/sync/events

Dispara manualmente una re-sincronización del indexador desde el último bloque procesado hasta
el bloque actual. Uso interno; protegido mediante autenticación de servicio (Authorization:
Bearer con token de servicio).

4.6.  Diseño de la interfaz de usuario

4.6.1.  Identidad visual

La identidad visual de NewsEra se diseñó para transmitir cuatro valores concretos: con-
fianza, transparencia, accesibilidad y progreso. Estos valores condicionan tanto la paleta
de color como el concepto del logotipo, y se aplican de forma deliberadamente minimalista:
el objetivo es que la atención del usuario recaiga sobre el contenido de los artículos, no sobre
la propia interfaz.

Paleta de color

La paleta parte de una base neutra (blanco y una escala de grises) sobre la que se añade
un  único  color  de  marca  y  una  paleta  funcional  reducida,  reservada  exclusivamente  para
comunicar el estado de consenso de un artículo. Esta separación es intencional: el color de
marca se usa solo en navegación y llamadas a la acción, mientras que los colores de estado
nunca  comparten  superficie  con  él,  evitando  que  la  interfaz  compita  visualmente  consigo
misma.

Logotipo

El logotipo es un monograma geométrico que combina las iniciales N y E de NewsEra.
La barra horizontal central de la E se redibuja sutilmente como una marca de verificación
(checkmark), vinculando visualmente la identidad de la marca con su propósito —la verifica-
ción comunitaria de contenido— sin recurrir a un icono figurativo adicional. Un ligero ángulo
de inclinación hacia la derecha en el trazo de la E sugiere avance y progreso. El resultado es
una marca reducible a tamaños pequeños (favicon, icono de aplicación), en un único color
sólido (el azul de marca de la Tabla 4.5), sin gradientes, sombras ni efectos tridimensionales,
alineada con el minimalismo del resto de la interfaz.

El logotipo de la Figura 4.4 se generó con Gemini (Google) a partir del siguiente prompt,
redactado  para  materializar  el  concepto  descrito  arriba  en  un  único  color  y  sin  elementos
decorativos:

“Minimalist flat vector logo mark, the letters ‘N’ and ‘E’ merged into a single
geometric  monogram,  bold  clean  sans-serif  geometric  letterforms,  the  crossbar
of  the  E  subtly  redrawn  as  a  checkmark  tick  to  suggest  verification  and  trust,
slight  forward-leaning  slant  on  the  E  to  suggest  progress  and  forward  motion,
single solid cobalt blue color (#2563EB) on a transparent or white background, no

58

Diseño del sistema

Tabla 4.5: Paleta de color de la identidad visual de NewsEra.

Uso

Acento de marca
(logotipo, enlaces,
navegación activa)

Color

Azul cobalto
#2563EB

Fondo y texto base

Blanco #FFFFFF /
gris oscuro #09090B

Texto secundario y
bordes
Estado de consenso
TRUE

Escala de grises
neutros
Verde esmeralda
#059669

Estado de consenso
FALSE

Rojo #DC2626

Estado de consenso
UNVERIFIABLE /
PENDING

Ámbar #D97706

Justificación

El azul es, de forma consistente en branding
institucional y financiero, el color asociado a
la confianza y la estabilidad; evita además el
rojo/naranja característico de los sitios sensa-
cionalistas que el proyecto busca diferenciarse
de
Máximo  contraste  y  mínimo  ruido  visual,
coherente con el objetivo de mantener el foco
en el artículo
Jerarquía visual sin introducir color adicional

Codificación funcional, no decorativa: permite
reconocer el estado de un artículo de un vis-
tazo
Uso puntual y acotado a una etiqueta peque-
ña, nunca como superficie grande, para no re-
producir la estética de alarma permanente de
los sitios de desinformación
Color de alerta neutro, sin connotación posi-
tiva ni negativa

Figura 4.4: Logotipo de NewsEra: monograma NE con marca de verificación integrada, gene-
rado con Gemini a partir del prompt de generación de imagen que se reproduce a continuación.

4.6.  Diseño de la interfaz de usuario

59

gradients, no shadows, no 3D effects, no decorative elements, extremely simple and
reducible to a small app icon / favicon size, flat design, vector illustration style,
generous negative space, symmetric balanced composition, tech startup branding,
trustworthy and modern feel”

4.6.2.  Estructura de la aplicación React

La aplicación se estructura como una SPA React con React Router v6; las rutas gestionadas

se detallan en RI 1 (§4.1.5).

Toda la interacción con la blockchain usa hooks de wagmi: useReadContract para lecturas,
useWriteContract para transacciones y useWaitForTransactionReceipt para esperar la
confirmación en cadena. El componente de conexión de cartera (RainbowKit) se mantiene en
el layout raíz y expone la dirección activa al resto de la aplicación mediante el contexto de
wagmi.

4.6.3.  Flujos de interacción principales

Los flujos de conexión de cartera, publicación y emisión de voto se documentan como casos
de uso detallados en la Sección 4.1.2 (UC 1, UC 19 y UC 35 respectivamente) y se integran
en una única narrativa completa, de extremo a extremo, en la Sección 4.7. El panel de repu-
tación  combina  lectura  directa  on-chain  (ReputationSystem.getReputation(address)
vía useReadContract) con la consulta del historial detallado al backend (GET /api/v1/validators/:address/history),
equilibrando autenticidad y eficiencia (UC 6, UC 7).

Toda  operación  de  escritura  en  la  blockchain  comparte  el  mismo  patrón  de  gestión  de

estados, descrito a continuación.

STICKY-NOTE  Gestión de estados en operaciones con blockchain Cada operación de escritura en la
blockchain —registro de publicación, emisión de voto— requiere que el usuario confirme
una  transacción  en  su  cartera  y  espera  la  inclusión  de  esa  transacción  en  un  bloque
(habitualmente en torno a 12 segundos en Sepolia Ethereum Foundation, 2022). El diseño
de la UX debe gestionar explícitamente los siguientes estados para cada operación:

1. Idle: estado inicial, sin transacción en curso.

2. Pending:  el  usuario  ha  iniciado  la  operación;  se  espera  su  confirmación  en  la

cartera.

3. Confirming: la transacción ha sido firmada y enviada a la red; se espera su inclu-

sión en un bloque.

4. Confirmed: la transacción ha sido incluida en un bloque; la operación se ha com-

pletado con éxito.

5. Failed: la transacción ha sido rechazada (por el usuario, por la red o por el con-

trato).

Los hooks useWriteContract y useWaitForTransactionReceipt de wagmi v2 expo-
nen directamente estos estados, simplificando su manejo en los componentes React.

60

Diseño del sistema

4.7.  Flujo de publicación y validación

Esta sección describe el flujo completo e integrado del ciclo de vida de una publicación en
NewsEra, desde que un usuario escribe un artículo hasta que recibe un veredicto de consenso
por  parte  de  la  comunidad  de  validadores.  Este  flujo  integra  las  tres  capas  del  sistema  y
demuestra el cumplimiento de los objetivos OE3 y OE4.

1. El usuario conecta su cartera. El usuario accede a la interfaz de NewsEra y conecta
su cartera Ethereum mediante RainbowKit. wagmi registra la dirección activa y la pone
a disposición de todos los Client Components.

2. El frontend calcula el hash del artículo. El usuario escribe el cuerpo del artículo
en el formulario de publicación. El frontend aplica la función keccak256 de viem sobre la
representación UTF-8 del texto y obtiene un valor de 32 bytes (bytes32) que identifica
de forma única ese contenido exacto. Cualquier modificación posterior al texto, aunque
sea de un solo carácter, producirá un hash completamente diferente.

3. El usuario registra el hash en la blockchain. Mediante el hook useWriteContract,
el frontend invoca PublicationRegistry.registerPublication(contentHash). El
usuario  confirma  la  transacción  en  su  cartera.  El  contrato  verifica  que  el  hash  no
ha sido registrado previamente; si es así, almacena la tripla (contentHash,  author,
timestamp) y emite el evento PublicationRegistered.

4. El  frontend  espera  la  confirmación  on-chain.  Mediante  el  hook  useWaitFor
TransactionReceipt, el frontend espera la inclusión de la transacción en un bloque.
La interfaz muestra el estado Confirming... al usuario durante esta espera.

5. El frontend envía el contenido al backend. Una vez confirmada la transacción, el
frontend envía el título, el cuerpo y las etiquetas del artículo al endpoint POST /api/
v1/publications del  backend.  El  backend  verifica  que  el  hash  del  cuerpo  recibido
coincide con el contentHash indicado y que ese hash existe en la blockchain. Si ambas
verificaciones son correctas, almacena la publicación en PostgreSQL.

6. El indexador del backend procesa el evento. En paralelo, el indexador del bac-
kend detecta el evento PublicationRegistered emitido por el contrato, actualiza el
registro de la publicación en PostgreSQL con los datos on-chain (autor y timestamp
confirmados) y pone la publicación en estado pendiente de validación.

7. Los validadores ven la publicación. La publicación aparece en la lista de artículos
pendientes de validación para todos los validadores registrados con reputación suficiente.
La lista se sirve mediante el endpoint REST del backend.

8. Un  validador  lee  el  artículo  y  emite  su  voto. El  validador  accede  a  la  pági-
na de detalle de la publicación, lee el contenido completo y decide su voto. El fron-
tend verifica, mediante una llamada de lectura a ReputationSystem.canValidate(
validatorAddress), que el validador tiene reputación mínima suficiente. A continua-
ción  lanza  la  transacción  ValidationRegistry.submitValidation(contentHash,
vote).

4.7.  Flujo de publicación y validación

61

9. El  contrato  registra  el  voto  y  comprueba  el  quórum. ValidationRegistry
almacena el voto del validador. Si el número total de votos alcanza el quórum configu-
rado (quorumThreshold), el contrato calcula el consenso por mayoría entre votos TRUE
y FALSE y emite el evento ConsensusReached.

10. El contrato actualiza las reputaciones. Inmediatamente tras calcular el consenso,
ValidationRegistry llama  a  ReputationSystem.increaseReputation para  cada
validador que votó en la dirección del consenso ganador y a decreaseReputation para
cada validador que votó de forma diferente al consenso — independientemente de si emi-
tieron TRUE, FALSE o UNVERIFIABLE. El tipo UNVERIFIABLE es un veredicto de primera
clase: los validadores que lo emiten son recompensados si ese tipo gana la supermayoría,
y penalizados en caso contrario. El contrato emite el evento ReputationUpdated para
cada dirección modificada.

11. El  indexador  sincroniza  el  estado  final.  El  indexador  del  backend  detecta  los
eventos ValidationSubmitted, ConsensusReached y ReputationUpdated, actualiza
los registros correspondientes en PostgreSQL y marca la publicación con el veredicto
de consenso.

12. El resultado es visible en la interfaz. La página de detalle de la publicación muestra
el veredicto de consenso, la lista completa de validadores que participaron, sus votos y
el impacto en sus reputaciones. Todo este historial es verificable de forma independiente
por cualquier usuario consultando directamente los eventos de la blockchain.

La Tabla 4.6 resume los actores, contratos y eventos involucrados en el flujo completo.

Tabla 4.6: Actores, contratos y eventos en el flujo de publicación y validación.

Paso Actor

Acción

1–2
3
3
5
6
8
9
9
10
10
11

Conecta cartera; calcula hash
Registra hash on-chain
Emite evento de registro
Envía contenido al backend

Usuario (frontend)
Usuario (frontend)
Contrato
Usuario (frontend)
Indexador (backend) Procesa evento; actualiza BD
Validador (frontend) Emite voto on-chain
Contrato
Contrato
Contrato
Contrato
Indexador (backend) Sincroniza estado final

Registra voto; calcula quórum
Emite consenso si hay quórum
Actualiza reputaciones
Emite eventos de reputación

Contrato / Evento

wagmi / viem
PublicationRegistry
PublicationRegistered
POST /publications
PostgreSQL
ValidationRegistry
ValidationSubmitted
ConsensusReached
ReputationSystem
ReputationUpdated
PostgreSQL

5.  Resultados

Este capítulo presenta los resultados obtenidos durante el desarrollo del prototipo de New-
sEra. Los datos cuantitativos —direcciones de contratos, costes de gas, cobertura de tests
y métricas de código— corresponden al estado del repositorio en Sprint 4 y se actualizan
automáticamente desde el repositorio de implementación mediante el flujo de CI de GitHub
Actions descrito en el §4.4.3. Esto garantiza que los valores reflejados en el documento siempre
sean coherentes con el código desplegado, sin requerir edición manual del texto.

5.1.  Resumen del prototipo implementado

El prototipo de NewsEra ha sido desarrollado de forma iterativa a lo largo de una serie de
sprints de dos semanas. El estado que se evalúa en este capítulo corresponde al Sprint 4. El
despliegue público en la red Sepolia está previsto para el Sprint 9.

El  prototipo  cubre  en  su  estado  actual  la  capa  on-chain:  los  tres  contratos  inteligentes
escritos en Solidity (PublicationRegistry, ValidationRegistry y ReputationSystem)
han sido implementados y verificados con pruebas unitarias sobre Hardhat Network. La capa
off-chain (API REST sobre Node.js/Hono y Prisma) y la interfaz de usuario (React/Vite con
wagmi y RainbowKit) están diseñadas y planificadas en los Sprints 7 y 8 respectivamente,
pero no forman parte del alcance de evaluación del presente capítulo.

En conjunto, los contratos implementados codifican los tres flujos fundamentales del siste-
ma: el registro inmutable de publicaciones, el proceso de validación comunitaria con gober-
nanza multironda, y el cálculo y actualización de la reputación de los validadores.

5.2.  Resultados de los contratos inteligentes

5.2.1.  Despliegue en Sepolia

Los tres contratos han sido verificados sobre Hardhat Network durante el período de eva-
luación cubierto por este capítulo. El despliegue público en la red de pruebas Sepolia está
previsto al concluir el Sprint 9; las direcciones de la Tabla 5.1 se actualizarán automáticamente
mediante CI en ese momento.

Tabla 5.1: Direcciones de despliegue previstas en Sepolia (pendiente Sprint 9).

Contrato

Dirección

PublicationRegistry
ValidationRegistry
ReputationSystem

pendiente
pendiente
pendiente

63

64

Resultados

Una vez completado el despliegue en Sepolia, las transacciones serán auditables en cualquier
explorador de bloques compatible con Ethereum. El diseño de cada contrato se describe en
el §4.3.

5.2.2.  Análisis de coste de gas

El análisis de coste de gas de las operaciones principales está planificado para el Sprint 9
(hardhat-gas-reporter, HU-9.4, en el despliegue en Sepolia). La Tabla 5.2 recoge las ope-
raciones a evaluar; los valores se actualizarán automáticamente mediante el flujo de CI al
concluir dicha fase.

Tabla 5.2: Coste de gas de las operaciones principales de los contratos.

Operación

Contrato  Gas consumido

registerPublication
submitValidation
requestReopen
claimRetroactiveReputation
increaseReputation
decreaseReputation

PublicationRegistry
ValidationRegistry
ValidationRegistry
ValidationRegistry
ReputationSystem
ReputationSystem

Coste medio

—
—
—
—
—
—

—

El umbral habitualmente aceptado en la literatura para considerar una operación eficiente
en Ethereum es de 100 000 gas (Buterin, 2014). El diseño de los contratos está orientado a
mantenerse por debajo de este umbral en las operaciones de escritura; la verificación empírica
de este objetivo está prevista al completar el Sprint 9, cuando se configure hardhat-gas-
reporter (HU-9.4). No obstante, el coste real en moneda fiat depende del precio del gas en
el momento de la transacción, variable que no puede garantizarse en la red principal. Esta
cuestión se analiza con mayor detalle en el §5.6.1.

5.2.3.  Cobertura de tests

La suite de tests de los contratos inteligentes alcanzó una cobertura de 96,25%, con 54 tests
superados sobre un total de 54 casos de prueba. El objetivo mínimo fijado en la planificación
del proyecto era del 80%, por lo que el resultado obtenido cumple el criterio establecido.

Los tests cubren los flujos principales de cada contrato (§4.3.1, §4.3.2 y §4.3.3), incluyendo
casos de error, condiciones de frontera y comprobaciones de acceso basadas en reputación.
Los  tests  de  integración  del  contrato  ReputationSystem son  los  más  extensos,  dado  que
la lógica de actualización de reputación implica múltiples transiciones de estado y eventos
dependientes.

5.3.  Métricas de implementación

La Tabla 5.3 recoge las líneas de código efectivas por capa del sistema, excluyendo comen-

tarios, líneas en blanco y archivos de configuración generados automáticamente.

5.4.  Evaluación del cumplimiento de objetivos

65

Tabla 5.3: Líneas de código por capa del sistema (Sprint 4).

Capa

Tecnología  Líneas de código (LOC)

Contratos inteligentes
API off-chain
Interfaz de usuario

Solidity
Node.js / TypeScript / Hono
React / Vite

—
—
—

La distribución de LOC refleja el carácter del prototipo: la capa de contratos inteligentes es
relativamente compacta en términos absolutos, lo que es coherente con la filosofía de mante-
ner en cadena exclusivamente la lógica que requiere inmutabilidad y trazabilidad, delegando
el  resto  al  backend  off-chain.  El  grueso  del  código  reside  en  la  API  y  en  el  frontend,  que
implementan los flujos de interacción con el usuario y la integración con los contratos.

5.4.  Evaluación del cumplimiento de objetivos

La Tabla 5.4 evalúa el grado de cumplimiento de cada objetivo específico definido en el §1.5,

a la luz de los resultados del prototipo en Sprint 4.

Tabla 5.4: Grado de cumplimiento de los objetivos específicos del trabajo.

Obj. Descripción resumida

Estado

OE1 Análisis del estado del arte

OE2 Diseño de la arquitectura del sistema

Completado — revisión bibliográfica de-
sarrollada en el Capítulo 2.
Completado — arquitectura global defi-
nida en el §4.3, §4.5 y §4.6.

OE3 Publicación y verificación descentralizada Completado

—

OE4 Reputación y gobernanza de validadores

OE5 Prototipo de interfaz de usuario

OE6

Integración de herramientas de IA

OE7 Evaluación de viabilidad del prototipo

contratos
y
implementa-

—

PublicationRegistry
ValidationRegistry
dos y desplegados; ver §4.3.1 y §4.3.2.
contrato
Completado
ReputationSystem
implementado
con mecanismo de actualización de repu-
tación basado en historial; ver §4.3.3.
En  desarrollo  —  diseño  de  la  interfaz
React/Vite documentado en §4.6; imple-
mentación prevista en el Sprint 8.
Opcional  —  no  implementado  en  el  al-
cance  del  prototipo  actual.  Identificado
como línea de trabajo futuro.
Completado — análisis desarrollado en el
presente capítulo (§5.6) y en las conclu-
siones (Capítulo 6).

66

Resultados

Los objetivos OE1–OE4 han sido completados en el periodo de implementación contem-
plado  por  este  capítulo.  OE5  (interfaz  de  usuario)  está  en  desarrollo  y  se  concluirá  en  el
Sprint 8. El objetivo opcional OE6 queda fuera del alcance acordado, tal como se recoge en la
planificación del §1.5. La evaluación de viabilidad (OE7) se desarrolla en la sección siguiente
y se complementa con las conclusiones del trabajo.

5.5.  Consideraciones de diseño: evolución del sistema

Esta sección documenta las decisiones de diseño que evolucionaron a lo largo del proceso de
desarrollo del prototipo. Para cada una se describe el diseño inicial, el problema que motivó
el cambio y la solución adoptada en la versión final. El objetivo es proporcionar trazabilidad
del razonamiento de diseño sin mezclar la narrativa de evolución con la descripción técnica
del sistema, que figura en el Capítulo 4 en su forma definitiva.

5.5.1.  De abstención a veredicto: el tipo UNVERIFIABLE

Diseño  inicial. El  tipo  de  voto  UNVERIFIABLE fue  concebido  originalmente  como  una
abstención: los votos de este tipo no influirían en el cómputo del consenso ni acarrearían con-
secuencias reputacionales. La lógica era que si un validador no puede determinar la veracidad,
su opinión no debería inclinar la balanza.

Problema  identificado. Este  enfoque  introduce  un  fallo  de  incentivos  grave:  sin  ries-
go  asociado,  UNVERIFIABLE se  convierte  en  la  opción  dominante  para  cualquier  validador
adversarial o pasivo. Un actor interesado en bloquear el consenso sobre un artículo puede
hacerlo acumulando votos UNVERIFIABLE sin coste reputacional alguno. Del mismo modo,
un validador que prefiere no emitir un juicio difícil simplemente vota UNVERIFIABLE y evita
la penalización, lo que vacía de significado la participación (Lesaege et al., 2019).

Solución adoptada. UNVERIFIABLE se elevó a veredicto de primera clase: participa
en el cómputo del consenso con el mismo peso que TRUE o FALSE, puede constituir el resultado
definitivo de una ronda si obtiene supermayoría, y votar UNVERIFIABLE sobre un artículo que
la comunidad luego califica como claramente verdadero o falso acarrea la misma penalización
que haber votado erróneamente. Esto elimina el incentivo a usarlo como refugio de riesgo
cero.

5.5.2.  De única ronda a sistema multironda con reapertura

Diseño  inicial. El  sistema  de  validación  fue  concebido  como  de  única  ronda:  una  vez
que una votación alcanzaba el quórum y producía un resultado (definitivo o disputado), el
proceso  quedaba  permanentemente  cerrado.  Ningún  validador  podía  revisar  ese  veredicto,
independientemente de nueva evidencia disponible.

Problema  identificado. El  diseño  de  única  ronda  es  inconsistente  con  el  principio  de
Adler y de Alfaro (2007) que el propio marco teórico del trabajo adopta como fundamento
del  sistema  de  reputación:  la  calidad  de  un  juicio  se  mide  por  su  capacidad  de  resistir  el
escrutinio de nuevos participantes independientes a lo largo del tiempo. Si el consenso queda
bloqueado tras la primera votación, ese principio se convierte en letra muerta. Además, la
experiencia de sistemas de verificación de hechos reales muestra que la información disponible

5.5.  Consideraciones de diseño:  evolución del sistema

67

sobre un artículo puede cambiar: surgen pruebas nuevas, se corrige contexto o se detectan
manipulaciones no visibles en el momento original de la votación.

También se consideró mantener la votación permanentemente abierta —cualquier validador
podría votar en cualquier momento—, pero este diseño introduce el problema del free rider:
un validador puede esperar a ver hacia dónde se dirige el consenso antes de votar, eliminando
el valor informativo del juicio independiente.

Solución adoptada. Se adoptó un mecanismo de reapertura por solicitudes: la vo-
tación se cierra al alcanzar el quórum (como en el diseño original), pero cualquier validador
con reputación suficiente que aún no haya votado ese artículo puede registrar una solicitud de
reapertura. Cuando se acumulan reopenThreshold solicitudes, el contrato abre una nueva
ronda de votación independiente. Los votos de cada ronda son inmutables: no pueden mo-
dificarse una vez emitidos, lo que preserva el valor informativo de cada juicio. El número de
rondas posibles no está limitado.

5.5.3.  De penalización simple a reputación retroactiva

Diseño inicial. Los efectos reputacionales se aplicaban únicamente al cierre de cada ron-
da y afectaban exclusivamente a los participantes de esa ronda: los que votaron la opción
ganadora recibían recompensa; los que votaron otra opción recibían penalización. El historial
de un validador no se veía afectado por rondas posteriores.

Problema identificado. El sistema de única ronda con efectos inmediatos no implementa
el principio de supervivencia del veredicto: un validador que acertó en la primera ronda de
un artículo pero que rondas posteriores contradicen no recibe ninguna señal de que su juicio
original resultó equivocado a la luz de nueva evidencia. Del mismo modo, un validador que
votó  erróneamente  en  una  ronda  temprana  no  se  beneficia  si  rondas  posteriores  le  dan  la
razón. La reputación queda desconectada de la evolución del conocimiento colectivo sobre
cada artículo.

Solución adoptada. Se diseñó un sistema de reputación retroactiva basado en el mo-
delo pull: cada validador puede llamar a claimRetroactiveReputation para recibir ajustes
de ±1 punto por cada ronda DEFINITIVE posterior a la suya que confirme o contradiga el
resultado de su ronda original, con un cap de ±3 por artículo. Se eligió el modelo pull —en
lugar de aplicar los ajustes automáticamente al cerrar cada ronda— para evitar que el coste
de gas en _checkConsensus escalara de forma proporcional al número total de participantes
históricos de un artículo. El validador activa el cálculo cuando lo desee, pagando únicamente
el gas de sus propios ajustes.

5.5.4.  De voto ponderado a voto plano con acceso gated

Diseño considerado. Una alternativa analizada es el voto ponderado por reputación:
que el voto de un validador con alta reputación acumulada compute con más peso que el de
uno recién llegado. El argumento intuitivo es que un historial de aciertos es señal de mejor
criterio, y que ese criterio debería tener mayor influencia en el consenso.

Problema identificado. El voto ponderado destruye la propiedad epistémica central del
sistema: la independencia de los votos. En un sistema de voto plano, cada validador tiene
incentivo para evaluar el artículo con su propio criterio, porque su voto computa igual que el
de cualquier otro. En un sistema ponderado, la estrategia racional pasa a ser observar hacia

68

Resultados

dónde se dirigen los validadores de alta reputación y sumarse a ellos antes de que el consenso
cierre, ya que la probabilidad de obtener la recompensa depende más de alinearse con los
actores dominantes que de emitir un juicio correcto. El resultado es un comportamiento
de manada que convierte el sistema en un mecanismo de ratificación del criterio de una élite
establecida, en lugar de una agregación de juicios independientes.

Este problema se agrava en combinación con el mecanismo de reapertura: los validadores
de rondas iniciales que acumularon alta reputación tendrían mayor capacidad para resistir el
desafío de nuevas rondas, haciendo el sistema progresivamente más resistente a la corrección
cuando más evidencia nueva existe.

Además, la resistencia Sybil que el voto ponderado proporcionaría ya está cubierta por el
umbral mínimo de reputación para acceder al rol de validador. No hay ventaja de seguridad
que justifique los efectos oligárquicos del voto ponderado.

Solución adoptada. Se adoptó voto plano con acceso gated: todos los votos de va-
lidadores acreditados computan igual, preservando la independencia de cada juicio. Para un
hipotético escalado a una comunidad de validadores muy amplia, la votación cuadrática
—peso proporcional a la raíz cuadrada de la reputación— constituye una evolución natural
que reduce la dominancia de los grandes acumuladores sin eliminarla por completo; esta línea
queda identificada como trabajo futuro.

5.6.  Discusión de resultados

5.6.1.  Viabilidad técnica del mecanismo de reputación

Los costes de gas medidos en la Tabla 5.2 indican que las operaciones del ReputationSystem
son técnicamente viables en la red de pruebas Sepolia. Sin embargo, la extrapolación a la red
principal de Ethereum requiere considerar varios factores que los datos del prototipo no pue-
den anticipar con certeza.

En primer lugar, el precio del gas en la red principal fluctúa significativamente en función
de la demanda de transacciones, pudiendo oscilar entre unos pocos gwei en periodos de baja
actividad y varios cientos de gwei en picos de congestión. Para una operación con un coste
de — unidades de gas, el coste en moneda fiat podría oscilar entre fracciones de céntimo y
varios euros dependiendo de las condiciones de red, lo que plantea incertidumbre sobre la
accesibilidad del sistema para usuarios con recursos limitados.

En segundo lugar, la cadena de actualizaciones de reputación derivada de una sesión activa
de validaciones puede generar varias transacciones por participante en un periodo corto. Si el
sistema alcanzara un número elevado de validadores activos simultáneos, el coste agregado de
las transacciones de reputación podría convertirse en una barrera de adopción. Una posible
mitigación es el uso de soluciones de layer 2 sobre Ethereum —como Optimism o Arbitrum—
que reducen los costes de gas en uno o dos órdenes de magnitud manteniendo las garantías
de seguridad de la cadena principal. Esta línea queda identificada como trabajo futuro.

En conjunto, los resultados obtenidos demuestran que el mecanismo de reputación es téc-
nicamente viable para un prototipo funcional con un número moderado de participantes, y
que  su  escalabilidad  a  producción  requiere  una  estrategia  de  despliegue  en  layer  2 o  una
revisión del modelo de cobros que permita subsidiar las transacciones de reputación para los
validadores activos.

5.6.  Discusión de resultados

69

5.6.2.  Limitaciones observadas durante la implementación

A lo largo de los sprints de desarrollo se identificaron las siguientes limitaciones e impedi-

mentos técnicos relevantes para la evaluación del prototipo:

• Alcance acotado a la capa de contratos. Los sprints de implementación completa-

dos cubren los tres contratos inteligentes (PublicationRegistry, ValidationRegistry
y ReputationSystem) con su suite de pruebas automatizadas. Las capas de backend
(API REST e indexador) y frontend forman parte del alcance del prototipo pero se
encuentran en fases de desarrollo posteriores al período de evaluación recogido en este
capítulo.

• Cobertura de pruebas limitada a la capa on-chain. Las métricas de cobertura
reflejan exclusivamente los contratos inteligentes. La validación end-to-end del sistema
completo —incluyendo la comunicación backend–blockchain y la experiencia de usuario
en el frontend— queda fuera del perímetro de evaluación actual.

• Ausencia de auditoría de seguridad profesional. Los contratos no han sido so-
metidos a una auditoría externa. El análisis estático realizado con Slither (Sprint 5)
cubre la verificación automatizada, pero no sustituye una revisión manual por expertos
en seguridad de contratos inteligentes, imprescindible antes de cualquier despliegue en
red principal.

• Entorno de pruebas local. Toda la evaluación se realizó sobre Hardhat Network, red
local que simula el comportamiento de la EVM sin las condiciones reales de una testnet
pública (latencia de bloques variable, competencia por gas, censura de mempool).

6.  Conclusiones

Este capítulo sintetiza los resultados del presente TFG sobre el diseño e implementación de
NewsEra, una plataforma descentralizada para la validación y difusión de información veraz
mediante tecnología blockchain. El trabajo ha completado el análisis del estado del arte, el
diseño de la arquitectura del sistema y la implementación de la capa on-chain del prototipo
—  los  tres  contratos  inteligentes  que  gobiernan  el  registro,  la  validación  comunitaria  y  la
reputación de validadores — tal como se recoge en el Capítulo 5. El backend y la interfaz de
usuario están diseñados y planificados en los Sprints 6 y 7. Las conclusiones que se exponen a
continuación se derivan de los resultados verificables del prototipo desarrollado y del análisis
técnico realizado a lo largo del trabajo.

6.1.  Conclusiones principales

El análisis realizado a lo largo del presente trabajo permite extraer las siguientes conclu-

siones:

1. La viabilidad técnica del diseño propuesto está respaldada por el estado del
arte. La revisión de la literatura científica y técnica realizada en el marco de OE1 con-
firma que todos los componentes del diseño de NewsEra tienen precedentes funcionales:
los contratos inteligentes sobre plataformas compatibles con la EVM soportan lógica de
gobernanza de la complejidad requerida (Buterin, 2014); los sistemas de identidad des-
centralizada estandarizados por la W3C proporcionan un mecanismo de acreditación
de  identidad  sin  dependencia  de  entidades  centrales  (World  Wide  Web  Consortium,
2022); y los protocolos de resolución de disputas en cadena, como Kleros, demuestran
la viabilidad de la validación comunitaria con incentivos económicos (Lesaege et al.,
2019). El diseño propuesto combina estos precedentes en una arquitectura coherente
orientada específicamente al problema de la desinformación.

2. La tecnología blockchain es, entre las infraestructuras técnicas disponibles
actualmente, la que ofrece mayores garantías de resistencia estructural a la
captura. El análisis del problema realizado en el capítulo 1 establece que la captura
estructural de los sistemas de información opera a través del control sobre las reglas de
publicación, verificación y distribución. La tecnología blockchain es, entre las opciones
técnicas disponibles actualmente, la que ofrece mayores garantías de inmutabilidad e
independencia  respecto  a  cualquier  actor  —incluyendo  los  propios  creadores  del  sis-
tema—  gracias  a  los  contratos  inteligentes  públicos  y  auditables  (Nakamoto,  2008).
Las soluciones centralizadas o federadas pueden modificar sus reglas de forma unila-
teral, mientras que un contrato desplegado en una red pública solo puede modificarse
mediante mecanismos transparentes que requieren consenso explícito.

71

72

Conclusiones

3. Los contratos inteligentes constituyen el mecanismo de gobernanza más ade-
cuado para este tipo de plataformas. El diseño propuesto codifica en Solidity las
reglas de publicación, verificación y cálculo de reputación, garantizando su transparen-
cia y resistencia a la manipulación (Ding et al., 2023). A diferencia de los sistemas de
moderación de contenido centralizados, cuyas políticas pueden cambiar sin notificación
ni rendición de cuentas, un contrato inteligente desplegado en la red solo puede mo-
dificarse mediante mecanismos de actualización explícitos y transparentes, auditables
por  cualquier  participante.  Esta  propiedad  es  esencial  para  el  problema  que  aborda
NewsEra.

4. El mecanismo de reputación on-chain —OE4, núcleo del sistema— establece
una  primera  barrera  técnica  eficaz  contra  los  ataques  Sybil  y  la  colusión,
si  bien  no  los  elimina  por  completo  sin  una  capa  adicional  de  identidad
verificable. El principal vector de ataque contra un sistema de validación comunitaria
es la creación masiva de identidades falsas (ataques Sybil) o la coordinación encubierta
entre validadores para sesgar los juicios (Feichtinger et al., 2023). El diseño propuesto
desincentiva ambos vectores: la reputación de cada validador se calcula a partir de su
historial verificable en cadena, lo que hace costosa la acumulación de influencia real con
identidades múltiples; y los mecanismos de penalización —reducción de reputación por
juicios divergentes del consenso— desincentivan la colusión sin necesidad de un árbitro
central (Lesaege et al., 2019). El mecanismo de reapertura por rondas complementa esta
protección: cuando un número suficiente de validadores nuevos solicita reconsiderar un
veredicto, se abre una ronda adicional de votación independiente; los validadores que
participaron en rondas anteriores reciben ajustes retroactivos de reputación en función
de si sus juicios originales son confirmados o contradichos por las rondas posteriores,
lo  que  alinea  sus  incentivos  con  la  precisión  a  largo  plazo  siguiendo  el  principio  de
supervivencia  del  veredicto  (Adler  &  de  Alfaro,  2007).  Esta  aproximación  mitiga  el
problema Sybil pero no lo resuelve completamente: la integración futura de identidad
descentralizada (DIDs/VCs W3C) (World Wide Web Consortium, 2022) constituye la
solución de nivel de producción prevista, descrita en la Sección 6.4.

5. NewsEra  es  un  complemento  a  los  medios  existentes,  no  un  sustituto. La
plataforma no pretende reemplazar a los medios de comunicación ni a los mecanismos
institucionales de verificación de contenidos. Su función es proporcionar una infraestruc-
tura alternativa y complementaria que devuelva al ciudadano la capacidad de verificar
de forma autónoma la autenticidad de un contenido informativo, sin dependencia de
ningún intermediario particular. Esta naturaleza complementaria limita el alcance de
las resistencias institucionales que puede encontrar y amplía el espacio de despliegue
real del sistema.

6. Las limitaciones de la infraestructura blockchain actual son reales pero no
insuperables en el plazo previsto. El análisis técnico realizado identifica tres limi-
taciones principales del diseño actual: el coste de las transacciones en cadena (gas), el
tiempo de finalidad del consenso en la red pública, y la brecha tecnológica que impide
a los ciudadanos ordinarios interactuar directamente con contratos inteligentes sin me-
diación de herramientas de abstracción. Las tres limitaciones tienen soluciones técnicas

6.2.  Contribuciones del trabajo

73

documentadas —redes de capa 2, abstracción de cuenta (account abstraction), inter-
faces de usuario Web3 simplificadas— cuya integración constituye una línea clara de
trabajo futuro (véase la Sección 6.4).

7. La viabilidad de NewsEra no es únicamente técnica: el diseño es condición
necesaria, pero no suficiente, para resolver el problema de la coordinación
social. Un  sistema  de  validación  comunitaria  descentralizada  solo  puede  cumplir  su
función si concurren condiciones sociales que el diseño técnico no puede garantizar por
sí solo: una masa crítica de validadores con disposición honesta, incentivos alineados con
el interés colectivo y una comunidad activa dispuesta a comprometer tiempo y atención
en el proceso de verificación. La resistencia estructural a la captura que proporciona la
tecnología blockchain es un habilitador necesario, pero la sostenibilidad del sistema de-
pende en última instancia de las condiciones de gobernanza comunitaria que lo rodean.
Este reconocimiento no invalida el valor del diseño propuesto, pero sitúa correctamente
su alcance: NewsEra es una infraestructura técnica que puede apoyar la coordinación
social veraz, no un mecanismo que la produce de forma autónoma.

6.2.  Contribuciones del trabajo

Las contribuciones del presente trabajo se articulan en tres dimensiones:

Contribución técnica: El diseño de una arquitectura de referencia para plataformas de va-
lidación de información descentralizadas. La arquitectura de NewsEra integra de forma
original cuatro tecnologías previamente desarrolladas de forma independiente —contra-
tos inteligentes EVM, sistemas de identidad descentralizada W3C (World Wide Web
Consortium, 2022), mecanismos de resolución de disputas en cadena (Lesaege et al.,
2019) y  frameworks Web3 de nueva generación— en un sistema  coherente orientado
específicamente al problema de la desinformación. Esta integración, documentada en
los capítulos de diseño y desarrollo, puede servir de referencia para proyectos con obje-
tivos similares. En particular, el diseño del mecanismo de reputación y gobernanza de
validadores —OE4— aporta una formulación concreta de cómo implementar incentivos
anti-Sybil y anti-colusión en un sistema de validación comunitaria sin autoridad central.

Contribución metodológica: La aplicación y adaptación del marco de trabajo Scrum a un
proyecto de investigación-implementación individual en un dominio técnico emergente
(Schwaber & Sutherland, 2020). La metodología empleada —descrita en el Capítulo 3—
demuestra la viabilidad de gestionar la incertidumbre técnica inherente al desarrollo con
tecnología blockchain mediante ciclos de sprints cortos con entregables incrementales, y
proporciona un modelo replicable para trabajos similares en titulaciones de ingeniería
informática.

Contribución académica: La síntesis del estado del arte en la intersección de tres campos
—tecnología blockchain y contratos inteligentes, gobernanza distribuida y sistemas de
reputación  descentralizados,  y  técnicas  computacionales  aplicadas  a  la  detección  de
desinformación— que han evolucionado de forma relativamente independiente. El marco
teórico  desarrollado  en  el  Capítulo  2  ofrece  una  visión  integrada  de  este  espacio  de

74

Conclusiones

soluciones, identifica las convergencias entre ellos y señala las brechas que justifican la
propuesta de NewsEra.

6.3.  Limitaciones

El presente trabajo presenta las siguientes limitaciones que conviene reconocer explícita-

mente:

1. Alcance  limitado  a  prototipo  funcional. NewsEra es un prototipo de investiga-
ción, no un sistema de producción. El diseño y la implementación están orientados a
demostrar la viabilidad técnica del enfoque propuesto, no a cubrir todos los requisitos
de seguridad, escalabilidad y resiliencia que exigiría un despliegue real con usuarios ma-
sivos. En particular, los contratos inteligentes desarrollados en el marco de OE3 y OE4
no han sido sometidos a una auditoría de seguridad profesional, que sería imprescindible
antes de cualquier despliegue en red principal.

2. Evaluación con datos sintéticos, no con usuarios reales. La evaluación del proto-
tipo, recogida en el Capítulo 5, está basada en escenarios de prueba con datos sintéticos
y  simulados.  No  se  han  realizado  pruebas  con  usuarios  reales  en  condiciones  de  uso
natural, lo que impide extraer conclusiones sobre el comportamiento del sistema ante
los patrones de uso reales —incluyendo estrategias de ataque activas por parte de acto-
res malintencionados— y sobre la usabilidad percibida por ciudadanos sin experiencia
previa con tecnología Web3.

3. Dependencia  de  Ethereum  Sepolia  y  sus  condiciones  de  red.  El  prototipo
está desplegado en la red de pruebas Ethereum Sepolia, cuyas condiciones —coste de
gas, tiempo de confirmación, disponibilidad de nodos— son distintas de las de la red
principal y pueden variar significativamente. Los resultados de rendimiento obtenidos
en  este  entorno  no  son  directamente  extrapolables  a  un  despliegue  en  red  principal
ni a redes de capa 2, cuyo comportamiento diferirá en parámetros relevantes para la
experiencia de usuario.

4. OE6 marcado como opcional y potencialmente fuera del prototipo. La inte-
gración de herramientas de IA para el análisis de contenido —detección de duplicados,
identificación de sesgos lingüísticos, análisis de imágenes manipuladas— está definida
como  objetivo  opcional  en  el  alcance  del  trabajo.  Su  implementación  depende  de  la
disponibilidad  de  tiempo  una  vez  completados  los  objetivos  obligatorios.  Si  OE6  no
se integra en la versión final del prototipo, el sistema carecerá de la capa de análisis
automático  prevista,  lo  que  limita  su  capacidad  de  apoyo  al  criterio  humano  de  los
validadores.

5. Ausencia de evaluación formal de usabilidad con usuarios finales. El diseño de
la interfaz de usuario desarrollada en el marco de OE5 no ha sido objeto de un proceso
formal de evaluación de usabilidad con participantes externos. La brecha tecnológica
entre los usuarios ciudadanos sin experiencia en Web3 y las interfaces actuales de inter-
acción con wallets y contratos inteligentes es una de las limitaciones más importantes

6.4.  Trabajo futuro

75

del ecosistema blockchain en general (Krombholz et al., 2016), y este trabajo no resuelve
ese problema estructural aunque sí procura minimizarlo en el diseño de la interfaz.

6. Riesgo de concentración de poder en validadores de alta reputación acumu-
lada. Aunque el diseño impide que un único actor capture unilateralmente las reglas del
protocolo, no impide que un grupo coordinado de validadores con alta reputación acu-
mulada llegue a dominar el proceso de consenso. Esta concentración no constituye un
fallo del diseño sino una limitación estructural inherente a los sistemas de reputación
stake-based: los primeros participantes y los más activos tienden a acumular ventaja
progresiva, lo que puede derivar en oligopolios de validación difíciles de revertir. Las
mitigaciones identificadas para futuras versiones del sistema incluyen mecanismos de
rotación  de  validadores,  quórum  aleatorio  ponderado  y  decaimiento  temporal  de  la
reputación inactiva.

7. Vulnerabilidad al ataque de whitewashing (lavado de reputación). En los sis-
temas de reputación acumulativa, el ataque whitewashing consiste en que un validador
cuya reputación ha sido degradada —por juicios incorrectos o sancionados— abandona
su dirección y crea una nueva para reiniciar desde cero. En NewsEra este ataque tiene
un coste reducido: únicamente el coste de arranque en gas necesario para comenzar a
acumular historial en cadena con la nueva identidad. Esta es una limitación conocida de
los mecanismos de reputación on-chain sin capa de identidad verificable: la ausencia de
vinculación entre la dirección blockchain y una identidad persistente hace que la penali-
zación reputacional sea eludible. Esta limitación es precisamente una de las razones por
las  que  la  integración  de  Identificadores  Descentralizados  y  Credenciales  Verificables
(DIDs/VCs W3C) (World Wide Web Consortium, 2022) queda identificada como línea
de trabajo futuro prioritaria en la Sección 6.4.

6.4.  Trabajo futuro

El análisis realizado y el desarrollo del prototipo identifican siete líneas de trabajo futuro
que permitirían evolucionar NewsEra desde un prototipo de investigación hacia un sistema
con potencial de despliegue real:

1. Migración a una red de capa 2 (Arbitrum o Polygon) para reducir costes y
aumentar el rendimiento. El principal obstáculo práctico para la adopción masiva
de NewsEra es el coste de las transacciones en la red principal de Ethereum. Las redes
de capa 2 —en particular Arbitrum y Polygon— ofrecen compatibilidad total con la
EVM y los contratos desarrollados en Solidity, con costes de transacción entre uno y tres
órdenes de magnitud inferiores y tiempos de confirmación significativamente menores.
La migración técnica es directa; el esfuerzo principal radicaría en la actualización de
la infraestructura de deploy y en la verificación del comportamiento del mecanismo de
gobernanza en el nuevo entorno de red.

2. Implementación  de  identidad  descentralizada  (DID/VC W3C)  para  resis-
tencia Sybil de nivel de producción. El diseño actual del mecanismo de reputación
desincentiva los ataques Sybil mediante el coste acumulativo de construir historial veri-
ficable, pero no impide la creación de identidades múltiples. La integración del estándar

76

Conclusiones

de Identificadores Descentralizados y Credenciales Verificables de la W3C (World Wide
Web Consortium, 2022) permitiría vincular la identidad on-chain de cada participante
a una acreditación criptográficamente verificable emitida por una entidad de confian-
za  —universitaria,  gubernamental  o  comunitaria—,  proporcionando  resistencia  Sybil
de nivel de producción sin comprometer el anonimato del participante frente a terce-
ros.  La  gestión  de  identidad  corporativa  en  blockchain es  un  campo  activo:  trabajos
como Balastegui-García et al. (2023) exploran soluciones para acreditación de identi-
dad organizacional en redes públicas, cuyas técnicas son aplicables a la acreditación de
validadores institucionales en NewsEra.

3. Integración del módulo de IA (OE6): detección de duplicados y análisis de
sesgo. Si OE6 no se completa en el alcance del prototipo actual, su implementación
constituye la primera línea de trabajo futuro de carácter técnico. El estado del arte re-
visado en el Capítulo 2 identifica las técnicas más prometedoras —modelos de lenguaje
para la detección de sesgos semánticos, hashing perceptual para duplicados de imáge-
nes, modelos de clasificación de desinformación— y los conjuntos de datos de referencia
disponibles para su entrenamiento y evaluación. La integración como servicio off-chain
consultado por los contratos inteligentes a través de oráculos preservaría la inmutabili-
dad y la descentralización del sistema principal. Trabajos relacionados, como Barański
et al. (2025), abordan la combinación de servicios anónimos con almacenamiento des-
centralizado  en  blockchain,  técnicas  directamente  aplicables  a  la  capa  de  análisis  de
contenido que contempla OE6.

4. Evaluación con usuarios reales y estudio formal de usabilidad. Una línea de
trabajo fundamental para medir el impacto real de la plataforma es la realización de
un estudio de usuario con participantes sin experiencia previa en tecnología Web3. Este
estudio permitiría identificar las barreras de adopción más significativas, validar las de-
cisiones de diseño de la interfaz implementadas en OE5 y obtener métricas de usabilidad
(Brooke, 1996) comparables con las de plataformas de información convencionales. Los
resultados informarían una segunda iteración del diseño de interfaz orientada específi-
camente a reducir la fricción cognitiva asociada a la interacción con wallets y contratos
inteligentes.

5. Gobernanza  evolutiva:  actualización  de  parámetros  del  sistema  mediante
votación on-chain. El diseño actual codifica los parámetros del mecanismo de repu-
tación y gobernanza —umbrales de acceso al rol de validador, pesos de penalización,
quórums de validación— como constantes en los contratos inteligentes. Una evolución
natural  del  sistema  es  permitir  que  la  propia  comunidad  de  participantes  modifique
esos parámetros mediante votación on-chain, convirtiendo NewsEra en una Decentra-
lized Autonomous Organization (DAO) capaz de adaptar sus reglas de forma colectiva
y transparente sin necesidad de una nueva versión de los contratos. Este mecanismo
requiere un diseño cuidadoso para evitar los vectores de ataque a la gobernanza docu-
mentados por Feichtinger et al. (2023), en particular las propuestas maliciosas de baja
visibilidad y la concentración de poder de voto en un número reducido de participantes.

6. Migración del índice off-chain a The Graph para eliminar el servidor centra-
lizado. El backend de NewsEra actúa en el prototipo actual como indexador centrali-

6.4.  Trabajo futuro

77

zado de eventos blockchain: escucha los eventos de los contratos y mantiene una réplica
consultable en una base de datos PostgreSQL que corre en un servidor bajo control del
equipo de desarrollo. Este componente constituye el único punto de centralización del
sistema, ya que su caída impide las consultas aunque los datos permanezcan íntegros
en la blockchain e IPFS. La solución de producción identificada es la migración a The
Graph Protocol: una red descentralizada de nodos indexadores que permite definir
un subgraph —un esquema de datos y un conjunto de manejadores de eventos en As-
semblyScript— que la red indexa y expone mediante una API GraphQL sin depender
de ningún servidor centralizado. The Graph es utilizado en producción por los princi-
pales protocolos DeFi (Uniswap, Aave, Compound) y representa el estándar de facto
para la indexación descentralizada de datos on-chain. Esta migración completaría la ar-
quitectura de NewsEra eliminando el único componente con dependencia centralizada,
haciendo el sistema plenamente resistente a la captura incluso a nivel de infraestructura
de consulta.

7. Veredicto  automatizado  y  verificable  on-chain mediante  zkML  y  oráculos
descentralizados. Una pregunta central sobre el diseño de NewsEra es si los contratos
inteligentes  podrían  contribuir  a  la  determinación  de  la  veracidad  de  un  artículo  de
forma automática, más allá de agregar los juicios humanos. La respuesta en el diseño
actual es negativa —los contratos no tienen acceso a información externa ni capacidad de
razonamiento semántico— pero el estado del arte en las intersecciones entre blockchain
e IA abre una línea de trabajo futuro genuinamente prometedora.

La restricción estructural de los contratos inteligentes es que no pueden acceder a datos
fuera de la cadena. Sin embargo, dos tecnologías en plena maduración permiten superar
esa limitación de forma verificable:

• Oráculos descentralizados (Chainlink Functions, API3): permiten que un con-
trato inteligente solicite la ejecución de código arbitrario fuera de la cadena —in-
cluida la llamada a un modelo de clasificación de texto— y reciba el resultado con
garantías criptográficas sobre la integridad de la computación. La red de nodos
del oráculo actúa como verificador distribuido, reduciendo la dependencia en un
único proveedor de confianza.

• zkML (Zero-Knowledge Machine Learning): proyectos como EZKL, Modu-
lus Labs u Ora Protocol permiten ejecutar un modelo de machine learning fuera
de la cadena y generar una prueba de conocimiento cero (ZK proof) que demuestra
que ese modelo concreto —cuyo hash es público y auditable— produjo ese resul-
tado concreto sobre ese contenido concreto. El contrato inteligente solo necesita
verificar la prueba, una operación computacionalmente económica. El resultado es
certificado y no puede ser falsificado sin invalidar la prueba.

Aplicado a NewsEra, este mecanismo permitiría introducir un cuarto tipo de veredicto
—AI_VERDICT— emitido por un modelo de clasificación de desinformación verificado
mediante zkML. Este veredicto podría participar en el cómputo del consenso con un
peso ponderado diferente al de los validadores humanos, actuando como señal técnica
complementaria al juicio colectivo de la comunidad. El modelo utilizado sería público,
auditable y parte del protocolo: su reemplazo requeriría el mismo consenso explícito que

78

Conclusiones

cualquier modificación de los contratos. De esta forma, la verificación automática no
recentralizaría el sistema, sino que añadiría una señal objetiva y verificable al proceso
de consenso humano.

Esta línea conecta directamente con trabajos del ámbito de blockchain aplicada a pro-
blemas de verificación e integridad en dominios donde la calidad de la información tiene
consecuencias directas, como los sistemas de gobierno inteligente (Mora et al., 2021) o
los sistemas de integridad deportiva (Sirvent-Llamas, Mora et al., 2025), que demues-
tran la aplicabilidad de la tecnología a contextos de verificación socialmente relevantes.

6.5.  Valoración personal

El desarrollo de este trabajo ha supuesto un proceso de aprendizaje que ha trascendido el
ámbito estrictamente técnico. El problema que aborda NewsEra —la captura estructural de
los sistemas de información— es, en primer lugar, un problema político y social antes que
tecnológico. Comprenderlo con la profundidad necesaria para diseñar una respuesta técnica
rigurosa  ha  requerido  un  recorrido  por  la  teoría  del  espacio  público  (Habermas,  1989),  la
economía política de los medios (Herman & Chomsky, 1988; McChesney, 2008) y la literatura
sobre los efectos de la algoritmización de la distribución de información (Pariser, 2011). Ese
recorrido ha modificado de forma duradera la forma en que me relaciono con el ecosistema
informativo digital, más allá de lo que este trabajo puede reflejar en sus páginas.

El trabajo en el dominio de la tecnología blockchain y el desarrollo Web3 ha presentado
desafíos técnicos de una complejidad diferente a la que se encuentra en el desarrollo de software
convencional. La necesidad de razonar simultáneamente sobre la seguridad criptográfica, el
modelo  de  ejecución  de  la  EVM,  el  coste  computacional  de  las  operaciones  en  cadena  y
la experiencia del usuario final en sistemas con confirmación asíncrona ha sido exigente y,
al mismo tiempo, intelectualmente estimulante. En particular, el diseño del mecanismo de
reputación  y  gobernanza  de  validadores  —componente  central  del  sistema—  ha  requerido
múltiples iteraciones para lograr un equilibrio entre la robustez ante los vectores de ataque
identificados y la practicabilidad del sistema para usuarios reales.

Finalmente, la perspectiva que este trabajo me ha permitido desarrollar sobre el potencial
de las tecnologías descentralizadas es matizada. La blockchain no es una solución universal ni
está exenta de limitaciones serias: los costes de transacción, la complejidad de la experiencia
de usuario, la concentración de poder que puede darse en los propios sistemas de gobernanza
distribuida (Feichtinger et al., 2023) y la brecha digital que separa a los ciudadanos ordinarios
de las herramientas Web3 son obstáculos reales que no pueden minimizarse. Sin embargo,
para el problema específico que aborda NewsEra —garantizar que las reglas que gobiernan la
publicación y la verificación de información no puedan ser capturadas por ningún actor con
suficiente poder económico o político— la descentralización criptográfica ofrece, hoy por hoy,
la respuesta técnica más sólida disponible. Desarrollar ese potencial de forma responsable,
con atención a sus limitaciones y a las condiciones sociales necesarias para su adopción real,
es el desafío que queda abierto.

Bibliografía

Adler, B. T., & de Alfaro, L. (2007). A Content-Driven Reputation System for the Wikipedia.
Proceedings of the 16th International Conference on World Wide Web, 261-270. https:
//doi.org/10.1145/1242572.1242608

Allen,  C.  (2016).  The  Path  to  Self-Sovereign  Identity.  Life  with  Alacrity.  https : / / www .

lifewithalacrity.com/2016/04/the-path-to-self-soverereign-identity.html

Balastegui-García, A., et al. (2023). Corporate Digital Identity Management on Blockchain.
Proceedings of the International Conference on Ubiquitous Computing and Ambient
Intelligence. https://doi.org/10.1007/978-3-031-19560-0_55

Barański, M., Szymański, J., & Mora, H. (2025). Anonymous Services on Blockchain with
Decentralised Storage. International Journal of Information Security. https://doi.
org/10.1007/s10207-025-01052-w

Benet, J. (2014). IPFS — Content Addressed, Versioned, P2P File System (Technical Report).
Protocol Labs. Consultado el 15 de enero de 2025, desde https://arxiv.org/abs/1407.
3561

Brooke,  J.  (1996).  SUS:  A  Quick  and  Dirty  Usability  Scale.  En  P.  W.  Jordan,  B.  Tho-
mas, B. A. Weerdmeester & I. L. McClelland (Eds.), Usability Evaluation in Industry
(pp. 189-194). Taylor & Francis.

Buterin, V. (2014). A Next-Generation Smart Contract and Decentralized Application Plat-

form. https://ethereum.org/en/whitepaper/

Ding, Q., Liebau, D., Wang, Z., & Xu, W. (2023). A Survey on Decentralized Autonomous
Organizations  (DAOs)  and  Their  Governance.  World  Scientific  Annual  Review  of
Fintech, 1. https://doi.org/10.1142/S281100482350001X

Douceur, J. R. (2002). The Sybil Attack. Peer-to-Peer Systems, 251-260. https://doi.org/10.

1007/3-540-45748-8_24

Ethereum Foundation. (2022). The Merge. Consultado el 15 de enero de 2025, desde https:

//ethereum.org/en/roadmap/merge/

Feichtinger, R., Fritsch, R., Vonlanthen, Y., & Wattenhofer, R. (2023). The Hidden Short-
comings of (D)AOs — An Empirical Study of On-Chain Governance. https://arxiv.
org/abs/2302.12125

Habermas, J. (1989). The Structural Transformation of the Public Sphere. MIT Press.
Hasan, H. R., & Salah, K. (2019). Combating Deepfake Videos Using Blockchain and Smart
Contracts. IEEE Access, 7, 41596-41606. https://doi.org/10.1109/ACCESS.2019.
2905689

Herman, E. S., & Chomsky, N. (1988). Manufacturing Consent: The Political Economy of

the Mass Media. Pantheon Books.

Institute of Electrical and Electronics Engineers. (1998). IEEE Std 830-1998 - IEEE Recom-
mended Practice for Software Requirements Specifications (Standard). IEEE.

79

80

Bibliografía

Krombholz, K., Judmayer, A., Gusenbauer, M., & Weippl, E. (2016). The Other Side of the
Coin: User Experiences with Bitcoin Security and Privacy. Financial Cryptography
and Data Security, 555-580. https://doi.org/10.1007/978-3-662-54970-4_33

Lesaege, C., Ast, F., & George, W. (2019). Kleros: Short Paper v1.0.7 — A Decentralized

Court. https://kleros.io/kleros.pdf

Mazzocca, C., Acar, A., Uluagac, S., Montanari, R., Bellavista, P., & Conti, M. (2025). A
Survey on Decentralized Identifiers and Verifiable Credentials. IEEE Communications
Surveys & Tutorials. https://doi.org/10.1109/COMST.2025.3543197

McChesney,  R.  W.  (2008).  The  Political  Economy  of  Media:  Enduring  Issues,  Emerging

Dilemmas. Monthly Review Press.

Messias,  J.,  Pahari,  V.,  Chandrasekaran,  B.,  Gummadi,  K.  P.,  &  Loiseau,  P.  (2023).  Un-
derstanding Blockchain Governance: Analyzing Decentralized Voting to Amend DeFi
Smart Contracts. https://arxiv.org/abs/2305.17655

Mora, H., et al. (2021). Disruptive Technologies for Smart Government. En Proceedings of the
International Conference on Technology and Innovation in Learning, Teaching and
Education. Springer. https://doi.org/10.1007/978-3-030-62066-0_6

Nakamoto, S. (2008). Bitcoin: A Peer-to-Peer Electronic Cash System. https://bitcoin.org/

bitcoin.pdf

Onyekachi, N. C. (2019). Applying Scrum Agile Framework to Academic Research and Deve-
lopment in the University Environment. International Journal of Scientific Research
and Management, 7 (3), 1089-1095. https://doi.org/10.18535/ijsrm/v7i3.ec02
Pariser, E. (2011). The Filter Bubble: What the Internet Is Hiding from You. Penguin Press.
Ries, E. (2011). The Lean Startup: How Today’s Entrepreneurs Use Continuous Innovation

to Create Radically Successful Businesses. Crown Business.

Schwaber, K., & Sutherland, J. (2020). The Scrum Guide: The Definitive Guide to Scrum:

The Rules of the Game. https://scrumguides.org/scrum-guide.html

Shu,  K.,  Sliva,  A.,  Wang,  S.,  Tang,  J.,  &  Liu,  H.  (2017).  Fake  News  Detection  on  Social
Media: A Data Mining Perspective. ACM SIGKDD Explorations Newsletter, 19(1),
22-36. https://doi.org/10.1145/3137597.3137600

Sirvent-Llamas, A., Mora, H., et al. (2025). Blockchain-Based Anti-Doping System for Sports
Integrity.  International  Journal  of  Sports  Medicine.  https : / / doi . org / 10 . 1177 /
17479541251394511

Wang, X., Xie, H., Ji, S., Liu, L., & Huang, D. (2023). Blockchain-based fake news traceability
and verification mechanism. Heliyon, 9(7), e17084. https://doi.org/10.1016/j.heliyon.
2023.e17084

Wardle,  C.,  &  Derakhshan,  H.  (2017).  Information  Disorder:  Toward  an  Interdisciplinary
Framework  for  Research  and  Policy  Making.  Council  of  Europe  Report,  27.  https :
//rm.coe.int/information-disorder-report-november-2017/1680764666

Weyl, E. G., & Posner, E. A. (2019). Radical Markets: Uprooting Capitalism and Democracy

for a Just Society. Princeton University Press.

World Wide Web Consortium. (2022). Decentralized Identifiers (DIDs) v1.0: Core Architectu-
re, Data Model, and Representations (inf. téc.). W3C. https://www.w3.org/TR/did-
core/

Zhou, X., & Zafarani, R. (2020). A Survey of Fake News: Fundamental Theories, Detection
Methods, and Opportunities. ACM Computing Surveys, 53(5), 1-40. https://doi.org/
10.1145/3395046

81

Lista de Acrónimos y Abreviaturas

ABI
ACID
APA
API

Application Binary Interface. 19, 22,
Atomicity, Consistency, Isolation, Durability.
American Psychological Association.
Application  Programming  Interface.  xv,  13,  18,  19,
22, 23, 34, 42, 49, 52, 55, 63, 65, 69, 77, , 92
Amazon Web Services.

AWS
BDIMS Blockchain-based  Decentralized  Identity  Manage-

ment System.
Continuous Delivery.
Content Delivery Network.
Continuous Integration. 63, 64,
Content Identifier. 13, 15, 22, 23, 52, , 95
Command Line Interface.
Convolutional Neural Network. 14,

CD
CDN
CI
CID
CLI
CNN
CRUD Create, Read, Update, Delete.
CSS
DAO

DBMS
DID
DL
DNS
EPS
ETL
EVM

Cascading Style Sheets. 22,
Decentralized Autonomous Organization. 10, 32, 76,
103
Database Management System.
Decentralized Identifier. 12,
Deep Learning.
Domain Name System.
Escuela Politécnica Superior.
Extract, Transform, Load.
Ethereum Virtual Machine. 9, 10, 21, 69, 71, 73, 75,
78,
Generative Adversarial Network.
GAN
Google Cloud Platform.
GCP
Graphical User Interface.
GUI
HyperText Markup Language.
HTML
HyperText Transfer Protocol. 23, 33,
HTTP
HTTPS HyperText Transfer Protocol Secure.
IA
IaaS
IDE
IEEE
IETF
IP

Inteligencia Artificial. 3–5, 7, 13, 65, 74, 76, 77,
Infrastructure as a Service.
Integrated Development Environment. 23,
Institute of Electrical and Electronics Engineers.
Internet Engineering Task Force.
Internet Protocol.

83

84

Lista de Acrónimos y Abreviaturas

IPFS

InterPlanetary File System. ix, xi, 12, 13, 15, 22, 23,
33, 34, 37, 52, , 94, 95
International Organization for Standardization.
JavaScript Object Notation.
JSON Web Token.
Kubernetes.
Large Language Model.

Machine Learning.
Model-View-Controller.
Minimum Viable Product. 25,

ISO
JSON
JWT
K8s
LLM
LSTM Long Short-Term Memory.
ML
MVC
MVP
MVVM Model-View-ViewModel.
NFT
NLP
NoSQL Not Only SQL.
OAuth
ORM
P2P
PaaS
RBAC
REST

Non-Fungible Token.
Natural Language Processing. 13,

Open Authorization.
Object-Relational Mapping. 22, 34, 37,
Peer-to-Peer. 3,
Platform as a Service.
Role-Based Access Control.
Representational State Transfer. 13, 19, 23, 37, 55,
63, 69,
Recurrent Neural Network.
Really Simple Syndication.
Software as a Service.
Software Development Kit.
Single Page Application. 22, 34, 36, 38, 59,
Structured Query Language.
Secure Sockets Layer.
System Usability Scale. 26, , 106, 107
Transmission Control Protocol.
Test-Driven Development.
Trabajo Fin de Grado. ix, 3, 17, 20, 32, 71, 103, 109
Trabajo Fin de Máster. , 109
Transport Layer Security.
Universidad de Alicante.
User Datagram Protocol.
Uniform Resource Identifier.
Uniform Resource Locator.
User Experience. 23, 59,
Verifiable Credential. 12,
Virtual Private Network.
World Wide Web Consortium. 12,
eXtensible Markup Language.

RNN
RSS
SaaS
SDK
SPA
SQL
SSL
SUS
TCP
TDD
TFG
TFM
TLS
UA
UDP
URI
URL
UX
VC
VPN
W3C
XML

Glosario de Términos

A

algoritmo Conjunto ordenado y finito de operaciones que permite hallar la solución de un
problema. Los algoritmos son la base de la programación y definen los pasos lógicos
para resolver tareas computacionales.

B

backend Parte del software que procesa la entrada desde el frontend, gestiona la lógica de
negocio y se comunica con la base de datos. También conocido como lado del servidor.
3, 5, 21, 23, 29, 32–34, 36–38, 54, 55, 59–61, 69, 90, 92, 96

C

cifrado Proceso de codificación de información para que solo las partes autorizadas puedan
acceder  a  ella.  Puede  ser  simétrico  (misma  clave)  o  asimétrico  (par  de  claves  públi-
ca/privada).

compilador Programa  informático  que  traduce  código  escrito  en  un  lenguaje  de  progra-
mación (código fuente) a otro lenguaje (código objeto), típicamente código máquina
ejecutable.

D

deploy Proceso  de  poner  una  aplicación  o  actualización  a  disposición  de  los  usuarios  fi-
nales. Incluye la instalación, configuración y activación del software en el entorno de
producción. 75

E

entorno Bloque de código en LATEX delimitado por \begin{nombre} y \end{nombre}. De-

fine un contexto especial para el contenido. , 109

escalabilidad Capacidad de un sistema para manejar una cantidad creciente de trabajo, o
su potencial para ser ampliado para acomodar ese crecimiento. Puede ser vertical (más
recursos) u horizontal (más instancias).

F

firewall Sistema de seguridad de red que monitoriza y controla el tráfico de red entrante y

saliente según reglas de seguridad predeterminadas.

85

86

Glosario de Términos

flotante Elemento (figura o tabla) que LATEX puede mover de su posición en el código fuente

para optimizar la maquetación. Se controla con especificadores como [htbp].

framework Estructura conceptual y tecnológica de soporte definido, normalmente con ar-
tefactos o módulos de software concretos, que puede servir de base para la organización
y desarrollo de software.

frontend Parte del software que interactúa directamente con el usuario. Incluye la interfaz
gráfica, formularios y todos los elementos visuales de una aplicación. 19, 21, 23, 29, 33,
34, 37, 38, 52, 69, 95, 96

H

hash Función  que  convierte  una  entrada  de  datos  de  cualquier  tamaño  en  una  salida  de
tamaño fijo. Se usa para verificar integridad de datos y almacenar contraseñas de forma
segura. 3, 8, 22, 37, 38, 40, 42, 43, 60, 94, 95, 97

I

índice Estructura de datos que mejora la velocidad de las operaciones de búsqueda en una

tabla de base de datos, a costa de espacio adicional y tiempo de escritura.

intérprete Programa  que  ejecuta  instrucciones  escritas  en  un  lenguaje  de  programación
línea por línea, sin necesidad de compilación previa. Python y JavaScript son ejemplos
de lenguajes interpretados.

L

latencia Tiempo  que  transcurre  desde  que  se  envía  una  solicitud  hasta  que  se  recibe  la

respuesta. En sistemas distribuidos, se mide típicamente en milisegundos.

M

macro Comando definido por el usuario en LATEX que representa una secuencia de instruc-

ciones. Permite automatizar tareas repetitivas y crear abstracciones. , 109

microservicio Estilo arquitectónico que estructura una aplicación como una colección de
servicios pequeños, autónomos y débilmente acoplados. Cada microservicio implementa
una funcionalidad de negocio específica.

middleware Software que actúa como puente entre el sistema operativo o base de datos y
las aplicaciones, especialmente en una red. Facilita la comunicación y gestión de datos
entre sistemas distribuidos.

monolito Arquitectura  de  software  donde  todos  los  componentes  de  la  aplicación  están
interconectados y son interdependientes, desplegándose como una única unidad.

N

Glosario de Términos

87

normalización Proceso de organización de datos en una base de datos relacional para redu-
cir la redundancia y mejorar la integridad de los datos. Incluye varias formas normales
(1NF, 2NF, 3NF, BCNF).

P

pipeline Secuencia automatizada de pasos para compilar, probar y desplegar software. En

CI/CD, los pipelines automatizan el flujo desde el código fuente hasta producción. 24

preámbulo Parte del documento LATEX entre \documentclass y \begin{document}. Con-

tiene la configuración del documento y la carga de paquetes.

Q

query Consulta o solicitud de datos a una base de datos. En SQL, las queries se escriben

usando comandos como SELECT, INSERT, UPDATE y DELETE.

R

refactorización Proceso de reestructurar código existente sin cambiar su comportamiento
externo. Mejora la legibilidad, reduce la complejidad y facilita el mantenimiento.

S

sprint Período de tiempo fijo (generalmente 2-4 semanas) durante el cual se completa un

conjunto específico de trabajo en metodologías ágiles como Scrum. 17–19, 73

T

throughput Cantidad de datos o transacciones que un sistema puede procesar en una unidad

de tiempo. Es una medida clave del rendimiento de sistemas.

token Cadena de caracteres que representa una credencial de seguridad o sesión. En auten-
ticación, los tokens permiten verificar la identidad sin transmitir contraseñas. 11

transacción Unidad  lógica  de  trabajo  en  una  base  de  datos  que  debe  completarse  en  su
totalidad o no ejecutarse en absoluto. Las transacciones garantizan la integridad de los
datos.

A.  Catálogo de casos de uso detallados

Este anexo desarrolla, con actor, precondiciones, flujo principal, flujos alternativos (cuando
existen) y postcondiciones, los 42 casos de uso (UC) definidos en la Especificación de Requisi-
tos de Software del Capítulo 4 (§4.1.1), agrupados por las cinco funcionalidades de alto nivel
(FEAT) de STQR 1. Sistema de publicación y verificación de contenidos. Los casos
de uso puramente navegacionales o de solo lectura se documentan con un nivel de detalle
proporcional a su sencillez.

A.1.  FEAT 1. Gestión de cuenta

BOOK Caso de uso: UC 1 — Conectar cartera

Actor(es): Visitante.
Precondiciones: el actor dispone de una cartera Ethereum compatible (MetaMask u
otra soportada por WalletConnect).
Flujo principal:

1. El actor pulsa el botón ConnectButton de RainbowKit, visible en la cabecera de

toda la aplicación.

2. El sistema solicita la conexión a la cartera instalada en el navegador.

3. El actor autoriza la conexión desde su cartera.

4. El sistema obtiene la dirección activa mediante useAccount() de wagmi y desblo-

quea FEAT 1, FEAT 2 y FEAT 4.

Flujos alternativos:

• Si el actor no tiene ninguna cartera instalada, RainbowKit ofrece enlaces de insta-

lación de carteras compatibles.

• Si el actor rechaza la conexión, el sistema permanece en el perfil público de solo

lectura (FEAT 3).

Postcondiciones:  la  dirección  activa  queda  disponible  en  toda  la  aplicación;  no  se
realiza ninguna escritura on-chain ni ninguna transacción es firmada por este caso de
uso.

89

90

Catálogo de casos de uso detallados

BOOK Caso de uso: UC 2 — Actualizar / modificar datos del perfil

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor edita nombre, avatar o email en el formulario de perfil.

2. El sistema solicita al actor que firme un mensaje mediante personal_sign para

demostrar la propiedad de la dirección.

3. El actor firma el mensaje desde su cartera — sin coste de gas, no es una transacción

on-chain.

4. El backend verifica la firma contra la dirección declarada y persiste los cambios en

la tabla UserProfile.

Flujos alternativos:

• Si la firma no corresponde a la dirección activa, el backend rechaza la actualización

con un error FORBIDDEN.

• El campo email es opcional; si se omite, no se activan notificaciones por correo.

Postcondiciones: el  perfil  enriquecido  queda  actualizado  sin  que  se  haya  requerido
contraseña alguna ni transacción on-chain.

BOOK Caso de uso: UC 3 — Revisar artículos favoritos

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor accede a su perfil y selecciona la pestaña de favoritos.

2. El sistema solicita GET /api/v1/profile/favorites.

3. El sistema muestra el listado paginado de artículos guardados mediante UC 31.

Flujos alternativos: si no hay favoritos guardados, el sistema muestra un estado vacío.
Postcondiciones: ninguna escritura; el actor visualiza el listado.

BOOK Caso de uso: UC 4 — Revisar artículos publicados propios

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

A.1.  FEAT 1.  Gestión de cuenta

91

1. El actor accede a su perfil y selecciona “Mis publicaciones”.

2. El sistema solicita GET /api/v1/publications?author=:address.

3. El sistema muestra el listado con título, estado de consenso y fecha de cada artículo

propio.

Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 5 — Revisar votaciones anteriores

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor accede a su perfil y selecciona “Mis votaciones”.

2. El sistema solicita GET /api/v1/validators/:address/history.

3. El sistema clasifica cada voto según el estado de la ronda: ganada (DEFINITIVE,
opción coincide con el voto), perdida (DEFINITIVE, opción distinta) o sin resol-
ver (DISPUTED o ronda aún PENDING).

4. El sistema muestra el porcentaje de aciertos (accuracy) junto al listado.

Postcondiciones: ninguna escritura; ninguna ronda DISPUTED se contabiliza como ga-
nada ni perdida.

BOOK Caso de uso: UC 6 — Revisar reputación

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor accede a su perfil.

2. El  sistema  invoca  ReputationSystem.getReputation(address)  mediante

useReadContract.

3. El sistema muestra la puntuación actual.

Postcondiciones: lectura on-chain directa, sin escritura.

92

Catálogo de casos de uso detallados

BOOK Caso de uso: UC 7 — Revisar evolución de la reputación

Actor(es): Usuario con cartera conectada.
Precondiciones: el backend ha indexado al menos un evento ReputationUpdated para
la dirección.
Flujo principal:

1. El actor accede a su perfil y selecciona “Evolución de reputación”.

2. El sistema solicita al backend la serie temporal de variaciones registradas por el

indexador (evento ReputationUpdated con su bloque y delta).

3. El sistema representa la evolución en un gráfico o listado cronológico.

Postcondiciones: ninguna escritura. Requiere un endpoint de agregación histórica aún
no especificado en el diseño de la API (§4.5.2) — pendiente de Sprint 7.

BOOK Caso de uso: UC 8 — Reclamar reputación neta

Actor(es): Usuario con cartera conectada.
Precondiciones: idénticas a UC 37.
Flujo principal: comparte el flujo íntegro con UC 37 (Reclamar reputación retroactiva,
§A.4); este caso de uso difiere únicamente en el punto de entrada, que es el listado de
reclamaciones pendientes del perfil en lugar del detalle del artículo.
Postcondiciones: ver UC 37.

BOOK Caso de uso: UC 9 — Revisar solicitudes de reapertura

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor accede a su perfil y selecciona “Solicitudes de reapertura”.

2. El sistema solicita el listado de ReopenRequest cuyo requesterAddress coincide

con la dirección activa.

3. El sistema muestra cada solicitud con el estado del artículo (pendiente de alcanzar

el umbral / ronda ya reabierta).

Postcondiciones: ninguna escritura.

A.2.  FEAT 2.  Publicar artículo

93

BOOK Caso de uso: UC 10 — Consultar notificaciones

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor abre el panel de notificaciones.

2. El sistema solicita el listado de Notification con userAddress igual a la direc-

ción activa.

3. El actor puede marcar una notificación como leída.

Flujos  alternativos: si  no  hay  notificaciones  nuevas,  el  sistema  muestra  un  estado
vacío.
Postcondiciones: al marcar como leída, read pasa a true; no hay ningún efecto on-
chain.

BOOK Caso de uso: UC 11 — Desconectar cartera

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor pulsa “Desconectar” en el menú de cuenta.

2. El sistema invoca disconnect() de wagmi.

3. El  sistema  vuelve  al  perfil  público  (FEAT  3),  bloqueando  FEAT  1,  FEAT  2  y

FEAT 4.

Postcondiciones: la sesión de cartera se cierra en el cliente; ningún dato on-chain ni
off-chain se modifica.

A.2.  FEAT 2. Publicar artículo

BOOK Caso de uso: UC 12 — Redactar artículo

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 1 completado.
Flujo principal:

1. El actor accede a /publish.

2. El actor completa el formulario siguiendo la plantilla estándar de redacción: título,
cuerpo,  etiquetas  (UC  14),  enlaces  internos  (UC  15)  y  referencias  bibliográficas
(UC 16).

94

Catálogo de casos de uso detallados

Postcondiciones: el contenido queda en el estado del formulario, sin persistir todavía.

BOOK Caso de uso: UC 13 — Guardar borrador

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 12 en curso.
Flujo principal:

1. El actor pulsa “Guardar borrador”.

2. El sistema persiste el contenido localmente, sin subida a IPFS ni transacción on-

chain.

Flujos alternativos: al reabrir /publish, el sistema recupera el último borrador guar-
dado.
Postcondiciones: el borrador queda disponible para retomar la redacción; no genera
ningún registro on-chain ni off-chain permanente.

BOOK Caso de uso: UC 14 — Etiquetar artículo por categoría/temática

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 12 en curso.
Flujo principal: el actor introduce una o varias etiquetas libres (tags) en el formulario
de publicación.
Postcondiciones: las etiquetas se incluyen en el payload de UC 19 (campo tags).

BOOK Caso de uso: UC 15 — Enlazar otros artículos de NewsEra

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 12 en curso.
Flujo principal: el actor inserta un hipervínculo interno (/article/:hash) hacia otro
artículo de NewsEra dentro del cuerpo del texto.
Postcondiciones: el hipervínculo forma parte del body y, por tanto, del contentHash
calculado en UC 18; cualquier edición posterior del enlace altera el hash.

BOOK Caso de uso: UC 16 — Referencias bibliográficas

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 12 en curso.
Flujo principal: el actor añade las fuentes citadas en la sección de referencias de la
plantilla.

A.2.  FEAT 2.  Publicar artículo

95

Postcondiciones: las referencias forman parte del body y del contentHash, igual que
UC 15.

BOOK Caso de uso: UC 17 — Vista previa del artículo antes de confirmar

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 12 completado.
Flujo principal:

1. El actor pulsa “Vista previa”.

2. El sistema renderiza el artículo con la plantilla final, tal como se mostrará una vez

publicado.

Postcondiciones: ninguna escritura; el actor puede volver a editar o continuar a UC 18.

BOOK Caso de uso: UC 18 — Mostrar hash calculado antes de firmar

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 17 completado.
Flujo principal:

1. El sistema calcula contentHash = keccak256(body) con viem.

2. El sistema muestra el valor al actor antes de solicitar la firma de UC 19.

Postcondiciones: ninguna  escritura;  el  hash  mostrado  debe  coincidir  con  el  que  se
registrará on-chain en UC 19.

BOOK Caso de uso: UC 19 — Confirmar publicación on-chain

Actor(es): Usuario con cartera conectada.
Precondiciones: el artículo ha sido redactado (UC 12) y el actor ha revisado la vista
previa (UC 17) y el contentHash calculado (UC 18).
Flujo principal:

1. El frontend calcula contentHash = keccak256(body) con viem.

2. El frontend sube el cuerpo del artículo a IPFS mediante la API de Pinata y obtiene

el CID.

3. El  actor  firma  la  transacción  registerPublication( contentHash) desde  su

cartera.

4. El

sistema

espera

la

confirmación

on-chain

mediante

useWaitForTransactionReceipt y muestra su estado.

96

Catálogo de casos de uso detallados

5. Tras  la  confirmación,  el  frontend  envía  POST /api/v1/publications  con

{contentHash, ipfsCid, title, body, tags} al backend.

6. El  indexador  detecta  el  evento  PublicationRegistered y  actualiza  la  réplica

off-chain.

Flujos alternativos:

• Si

el

contentHash

ya

existe,

la

transacción

revierte

con

PublicationAlreadyExists; no se publica contenido duplicado.

• Si el actor rechaza la firma, no se produce ningún cambio y el borrador (UC 13)

se conserva para un intento posterior.

Postcondiciones: el artículo queda registrado de forma inmutable on-chain, con autoría
y fecha asignadas automáticamente por el sistema, y es visible en el feed (UC 20) tras
la sincronización del indexador.

A.3.  FEAT 3. Explorar contenido

BOOK Caso de uso: UC 20 — Consultar feed de artículos recientes

Actor(es): Visitante o Usuario.
Precondiciones: ninguna — accesible sin cartera conectada.
Flujo principal:

1. El actor navega a /.

2. El sistema solicita GET /api/v1/publications (página 1).

3. El  sistema  muestra  una  lista  paginada  con  título,  autor,  estado  de  consenso  y

número de votos por artículo.

Flujos alternativos: si el backend no responde, el sistema muestra un error con opción
de reintentar (RI 5); si no hay publicaciones, muestra un estado vacío.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 21 — Buscar / filtrar artículos

Actor(es): Visitante o Usuario.
Flujo principal:

1. El actor introduce un término de búsqueda o selecciona un filtro (estado de con-

senso, etiqueta, autor).

A.3.  FEAT 3.  Explorar contenido

97

2. El sistema solicita GET /api/v1/publications con los parámetros de filtro co-

rrespondientes.

3. El sistema actualiza el listado.

Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 22 — Ver detalle de artículo

Actor(es): Visitante o Usuario.
Flujo principal:

1. El actor selecciona un artículo del feed o de un resultado de búsqueda.

2. El sistema solicita GET /api/v1/publications/:hash.

3. El sistema muestra el contenido completo y los metadatos del artículo.

Flujos alternativos: si el hash no existe, el sistema muestra un error 404.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 23 — Ver estado de consenso del artículo

Actor(es): Visitante o Usuario.
Precondiciones: UC 22 en curso.
Flujo
principal:
(PENDING/DEFINITIVE/DISPUTED) obtenido en la respuesta de UC 22.
Postcondiciones: ninguna escritura.

sistema  muestra

campo

el

el

consensusState

BOOK Caso de uso: UC 24 — Ver recuento de votos del artículo

Actor(es): Visitante o Usuario.
Precondiciones: UC 22 en curso.
Flujo  principal:  el  sistema  muestra,  por  ronda,  el  número  de  votos  de  cada  tipo
(TRUE/FALSE/UNVERIFIABLE), obtenido de roundVoteCount y de la réplica off-chain.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 25 — Consultar ranking de validadores por reputación

Actor(es): Visitante o Usuario.
Flujo principal:

1. El actor navega a /validators.

98

Catálogo de casos de uso detallados

2. El  sistema  solicita  GET /api/v1/validators,  ordenado  por  reputationScore

descendente.

3. El sistema muestra el listado paginado.

Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 26 — Consultar perfil público de una dirección

Actor(es): Visitante o Usuario.
Flujo principal:

1. El  actor  navega  a  /validators/:address o  accede  desde  UC  30  (perfil  de  un

autor).

2. El

solicita
GET /api/v1/publications?author=:address.

sistema

GET /api/v1/validators/:address

y

3. El sistema muestra reputación, historial de validación y artículos publicados por

esa dirección.

Flujos alternativos: si la dirección no está registrada como validador, el sistema mues-
tra igualmente sus artículos publicados, sin datos de reputación.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 27 — Acceder a la verificación del artículo

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso.
Flujo principal: el actor pulsa el enlace o botón “Verificar” en el detalle del artículo,
que navega a las herramientas de FEAT 4 (§A.4).
Postcondiciones: ninguna escritura; es un caso de uso de navegación puro.

BOOK Caso de uso: UC 28 — Ordenar resultados del feed/búsqueda

Actor(es): Visitante o Usuario.
Precondiciones: UC 20 o UC 21 en curso.
Flujo principal: el actor selecciona un criterio de ordenación (fecha, número de votos,
estado de consenso); el sistema reordena el listado ya cargado o solicita una nueva página
con el parámetro de orden.
Postcondiciones: ninguna escritura.

A.4.  FEAT 4.  Verificar artículo

99

BOOK Caso de uso: UC 29 — Seguir un artículo

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso.
Flujo principal:

1. El actor pulsa “Seguir” en el detalle del artículo.

2. El sistema registra la relación de seguimiento asociada a la dirección del actor.

3. A partir de este momento, los cambios de estado del artículo generan una notifi-

cación (UC 10), según RD 20–RD 21.

Postcondiciones: el actor queda suscrito a las notificaciones de ese artículo.

BOOK Caso de uso: UC 30 — Compartir artículo

Actor(es): Visitante o Usuario.
Precondiciones: UC 22 en curso.
Flujo principal: el actor pulsa “Compartir”; el sistema copia o expone el enlace directo
/article/:hash.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 31 — Guardar / quitar artículo como favorito

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso.
Flujo principal:

1. El actor pulsa el icono de favorito en el detalle o en una tarjeta del feed.

2. El

sistema

invoca

POST /api/v1/favorites/:hash

(guardar)

o

DELETE /api/v1/favorites/:hash (quitar).

Postcondiciones: el artículo aparece o desaparece del listado de UC 3.

A.4.  FEAT 4. Verificar artículo

BOOK Caso de uso: UC 32 — Consultar bibliografía y enlaces internos citados

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso.
Flujo  principal:  el  sistema  muestra,  dentro  del  detalle  del  artículo,  las  referencias
bibliográficas (UC 16) y los hipervínculos internos (UC 15) con acceso directo a cada
fuente.

100

Catálogo de casos de uso detallados

Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 33 — Comparar con otros artículos de NewsEra sobre el mismo tema

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso; el artículo tiene al menos una etiqueta (UC 14).
Flujo  principal: el sistema solicita  GET /api/v1/publications?tags=… y muestra
artículos relacionados por etiqueta compartida, para que el actor pueda contrastar la
información antes de votar.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 34 — Consultar historial de rondas anteriores y su resultado

Actor(es): Usuario con cartera conectada.
Precondiciones: UC 22 en curso; currentRound > 1.
Flujo principal: el sistema muestra, por cada ronda anterior, su resultado (result) y
estado (state), obtenidos de rounds (on-chain) y de la réplica Round (off-chain).
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 35 — Votar artículo

Actor(es):  Usuario  con  cartera  conectada  y  reputación  igual  o  superior  a
MIN_REPUTATION_TO_VALIDATE.
Precondiciones: el artículo está en estado PENDING; el actor no ha votado previamente
ese artículo, en ninguna ronda; canValidate(address) == true.
Flujo principal:

1. El actor accede al detalle del artículo (UC 22) y selecciona una opción: TRUE, FALSE

o UNVERIFIABLE.

2. El

sistema
useWriteContract.

invoca

submitValidation(contentHash, vote)  mediante

3. El actor firma la transacción desde su cartera.

4. El sistema espera la confirmación on-chain y muestra su estado.

5. El indexador procesa el evento ValidationSubmitted y actualiza la réplica off-

chain.

6. Si se alcanza el quórum, el sistema refleja el nuevo estado de consenso (DEFINITIVE
o DISPUTED) y el efecto reputacional inmediato sobre los votantes de la ronda.

Flujos alternativos:

A.4.  FEAT 4.  Verificar artículo

101

• Si canValidate == false, el control de voto aparece deshabilitado indicando el

motivo (reputación insuficiente).

• Si el actor rechaza la firma, no se realiza ningún cambio.

• Si la transacción revierte (AlreadyValidated, VotingNotOpen), el sistema tra-
duce el error a lenguaje natural y no permite reintentar la misma acción sobre ese
artículo.

Postcondiciones: el voto queda registrado de forma inmutable on-chain; si la ronda
alcanzó DEFINITIVE, la reputación de los votantes de esa ronda se actualiza según UC 40.

BOOK Caso de uso: UC 36 — Solicitar reapertura de un artículo concluido

Actor(es): Usuario con cartera conectada y reputación suficiente.
Precondiciones: el  artículo  está  en  estado  DEFINITIVE o  DISPUTED;  el  actor  no  ha
votado ese artículo y no ha solicitado ya su reapertura.
Flujo principal:

1. El actor solicita la reapertura desde el detalle del artículo.

2. El sistema invoca requestReopen(contentHash).

3. El actor firma la transacción desde su cartera.

4. El contrato incrementa el contador de solicitudes y emite ReopenRequested.

5. Si el contador alcanza reopenThreshold, el contrato abre una nueva ronda y emite
VotingReopened; el contador de solicitudes se reinicia a cero para ese artículo.

Flujos alternativos:

• Si el estado del artículo no es DEFINITIVE ni DISPUTED, la transacción revierte

con ReopenNotAvailable.

• Si el actor ya votó ese artículo, revierte con AlreadyValidated; si ya solicitó la

reapertura, revierte con AlreadyRequestedReopen.

• Si la reputación del actor es insuficiente, revierte con InsufficientReputation.

Postcondiciones: la solicitud queda registrada de forma permanente; si se alcanzó el
umbral, el artículo vuelve a estado PENDING en una nueva ronda, visible en UC 34 y
UC 38.

102

Catálogo de casos de uso detallados

BOOK Caso de uso: UC 37 — Reclamar reputación retroactiva

Actor(es): Usuario con cartera conectada que votó una ronda anterior a la ronda actual
del artículo.
Precondiciones: existen rondas DEFINITIVE posteriores a la ronda en la que votó el
actor, aún no reclamadas por él.
Flujo principal:

1. El actor solicita la reclamación desde su perfil (UC 8) o desde el detalle del artículo

(UC 37 propiamente dicho).

2. El sistema invoca claimRetroactiveReputation(contentHash).

3. El actor firma la transacción desde su cartera.

4. El  contrato  recorre  las  rondas  DEFINITIVE posteriores  a  la  del  actor,  aplica
RETROACTIVE_DELTA (+1/–1) por cada una según confirmen o contradigan su voto
original, limita el resultado a RETROACTIVE_CAP y emite RetroactiveClaimed con
el netDelta resultante — pérdidas y ganancias combinadas en una única cifra.

Flujos alternativos:

• Si el actor no votó ese artículo o no existen rondas nuevas que reclamar, la tran-

sacción revierte con NothingToClaim.

Postcondiciones: la reputación del actor se ajusta en netDelta; la reclamación que-
da registrada en RetroactiveClaim y no puede repetirse para las mismas rondas ya
procesadas.

BOOK Caso de uso: UC 38 — Ver progreso hacia el quórum

Actor(es): Usuario con cartera conectada.
Precondiciones: el artículo está en estado PENDING.
Flujo  principal:  el  sistema  muestra  roundVoteCount de  la  ronda  actual  frente  a
quorumThreshold, como una barra de progreso o fracción.
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 39 — Consultar qué validadores ya han votado en la ronda actual

Actor(es): Usuario con cartera conectada.
Precondiciones: el artículo está en estado PENDING.
Flujo principal: el sistema invoca getRoundVoters(contentHash, currentRound)
y muestra el listado de direcciones que ya emitieron su voto en la ronda activa.
Postcondiciones: ninguna escritura; no se revela el sentido del voto de cada validador,
solo su participación.

A.5.  FEAT 5.  Información institucional

103

BOOK Caso de uso: UC 40 — Ver el efecto reputacional estimado antes de votar

Actor(es): Usuario con cartera conectada.
Precondiciones: el artículo está en estado PENDING.
Flujo  principal:  antes  de  que  el  actor  confirme  su  voto  en  UC  35,  el  sistema
muestra  el  efecto  potencial  sobre  su  reputación  según  el  resultado  de  la  ronda:
+REPUTATION_REWARD si  su  opción  resulta  ganadora,  -REPUTATION_PENALTY en  caso
contrario, 0 si la ronda queda DISPUTED.
Postcondiciones: ninguna  escritura;  es  información  orientativa,  no  vinculante  hasta
que se calcula el consenso real.

A.5.  FEAT 5. Información institucional

BOOK Caso de uso: UC 41 — Consultar landing page

Actor(es): Visitante.
Precondiciones: ninguna.
Flujo principal: el actor accede a la landing page del proyecto; el sistema muestra la
propuesta de valor y los tres pilares (Inmutabilidad, Validación colectiva, Resistencia a
la captura).
Postcondiciones: ninguna escritura.

BOOK Caso de uso: UC 42 — Consultar página “Sobre el proyecto”

Actor(es): Visitante.
Precondiciones: ninguna.
Flujo principal: el actor navega a /about; el sistema muestra el funcionamiento del
proyecto, la descripción de la DAO y el enlace público a la memoria del TFG.
Postcondiciones: ninguna escritura.

B.  Instrumentos de los experimentos de validación

Este anexo recoge el contenido íntegro de los dos experimentos de validación descritos en la
Sección 3.6.5 (hipótesis y criterios de éxito), listos para su implementación dentro de la demo
construida específicamente para este fin. Los resultados obtenidos al ejecutarlos se recogen
en el Capítulo 5.

STICKY-NOTE  Orden de administración Ambos bloques se administran en una única sesión, en el
orden fijo descrito a continuación: primero el Bloque A (Experimento 1), después una
página explicativa de las mecánicas del proyecto y un recorrido interactivo por la demo,
y finalmente el Bloque B (Experimento 2). Este orden es deliberado: preguntar por la
gravedad percibida del problema después de mostrar la solución contaminaría la respuesta
con la propia propuesta de valor que se le acaba de presentar al participante.

B.1.  Bloque A — Experimento 1: intensidad del problema

Se administra antes de cualquier mención a NewsEra. Introducción mostrada al participan-
te: “Antes de continuar, queremos conocer tu experiencia con las noticias y la información
que consumes online. No hay respuestas correctas ni incorrectas.”

Escala Likert de 5 puntos (1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo),

salvo donde se indica lo contrario:

1. Con  frecuencia  encuentro  en  redes  sociales  o  internet  noticias  que  sospecho  que  son

falsas o engañosas.

2. Confío en que las plataformas donde consumo noticias me muestran información veraz.

3. Alguna vez he compartido o creído como cierta una noticia que después resultó ser falsa.

4. Me resulta difícil distinguir por mi cuenta qué información es fiable y cuál no.

5. (Ítem de contraste directo contra el criterio de gravedad.) En general, ¿qué
gravedad le das al problema de la desinformación hoy en día? (1 = Nada grave, 5 =
Muy grave)

6. (Ítem  de  contraste  directo  contra  el  criterio  de  método  fiable.) ¿Dispones
actualmente de un método que consideres fiable para verificar si una noticia es cierta?
(Sí / No / No estoy seguro)

Los ítems 1–4 aportan contexto cualitativo y permiten detectar inconsistencias en las res-
puestas; los ítems 5 y 6 son los que se contrastan directamente contra el criterio de éxito
fijado en §3.6.5 (al menos el 60 % califica el problema con 4 o 5 en el ítem 5; al menos el 50 %
responde “No” o “No estoy seguro” en el ítem 6).

105

106

Instrumentos de los experimentos de validación

B.2.  Página explicativa

Entre  el  Bloque  A  y  el  Bloque  B  se  presenta  al  participante  una  página  que  explica  el
funcionamiento de NewsEra (publicación, validación comunitaria, reputación) y un recorrido
interactivo por la demo. El contenido de esta página se mantiene deliberadamente descrip-
tivo, no promocional: un tono de venta contaminaría las medidas de confianza percibida y
usabilidad del Bloque B, que dejarían de evaluar la interfaz para evaluar la persuasión del
texto.

B.3.  Bloque B — Experimento 2: idoneidad del producto

Se administra inmediatamente después de que el participante complete el recorrido inter-

activo por la demo.

B.3.1.  Parte 1 — System Usability Scale

Los diez ítems estándar del SUS (Brooke, 1996), sin alterar el orden ni la alternancia entre
enunciados positivos y negativos —alterarlos invalida la comparabilidad de la puntuación con
la literatura de referencia—. Escala 1-5 (1 = Totalmente en desacuerdo, 5 = Totalmente de
acuerdo):

1. Creo que me gustaría usar este sistema con frecuencia.

2. He encontrado el sistema innecesariamente complejo.

3. Me ha parecido que el sistema era fácil de usar.

4. Creo que necesitaría el apoyo de alguien con conocimientos técnicos para poder usarlo.

5. Me ha parecido que las distintas funciones del sistema estaban bien integradas.

6. He encontrado demasiada inconsistencia en el sistema.

7. Me imagino que la mayoría de la gente aprendería a usar este sistema muy rápidamente.

8. He encontrado el sistema muy incómodo de usar.

9. Me he sentido muy seguro/a usando el sistema.

10. Necesité aprender muchas cosas antes de poder manejarme con el sistema.

Cálculo de la puntuación (estándar de Brooke, no debe alterarse): para los ítems impares
(1,  3,  5,  7,  9),  puntuación  parcial  =  respuesta  −1;  para  los  ítems  pares  (2,  4,  6,  8,  10),
puntuación parcial = 5− respuesta. La suma de las diez puntuaciones parciales, multiplicada
por 2.5, da la puntuación SUS final en una escala de 0 a 100. El criterio de éxito fijado en
§3.6.5 es una media ≥ 68.

B.4.  Recomendaciones de muestra

107

B.3.2.  Parte 2 — Idoneidad específica del producto

Escala 1-5 salvo donde se indica:

11. He entendido con claridad para qué sirve NewsEra tras ver la demo.

12. Confío en que el mecanismo de validación comunitaria (votos y reputación) produce un

veredicto fiable.

13. Publicar un artículo me ha parecido un proceso claro.

14. Validar un artículo (votar sobre su veracidad) me ha parecido un proceso claro.

15. (Ítem de contraste directo contra el criterio de intención de uso.) ¿Usarías

NewsEra si estuviera disponible? (Sí / Tal vez / No)

16. ¿Qué es lo que más te ha gustado? (respuesta abierta, opcional)

17. ¿Qué cambiarías o mejorarías? (respuesta abierta, opcional)

El  ítem  15  se  contrasta  contra  el  criterio  de  éxito  de  §3.6.5  (al  menos  el  60 %  expresa
intención  de  uso).  Solo  las  respuestas  “Sí”  cuentan  como  intención  de  uso  positiva  en  el
cálculo del porcentaje; las respuestas “Tal vez” se reportan por separado, sin mezclarlas en
el mismo porcentaje.

B.4.  Recomendaciones de muestra

El Bloque A no depende de la interacción con la demo y puede difundirse de forma inde-
pendiente (redes sociales, foros) para ampliar su alcance sin coste adicional; se recomienda un
tamaño muestral mínimo de 50 participantes. El Bloque B exige completar el recorrido inter-
activo por la demo; se recomienda un mínimo de 30 participantes. La literatura de usabilidad
considera que muestras de 12-15 participantes ya son suficientes para detectar los problemas
de usabilidad más graves (Brooke, 1996), pero una muestra mayor da mayor fiabilidad a la
media SUS reportada en la memoria.

C.  Técnicas Avanzadas de LATEX

Este anexo presenta técnicas avanzadas de LATEX que pueden ser útiles en la elaboración
de un TFG o Trabajo Fin de Máster (TFM): tablas rotadas, páginas en horizontal, inclusión
de documentos PDF externos, y otras funcionalidades. Estas técnicas aprovechan diversas
macros y entornos especializados.

INFO-CIRCLE  Contenido de este anexo

• Tablas rotadas con sidewaystable

• Páginas en orientación horizontal (landscape)

• Inclusión de documentos PDF externos

• Figuras de ancho completo

• Notas al margen, marcas de agua y texto en columnas

• Minipáginas y cajas para contenido lado a lado

C.1.  Tablas Rotadas (Sideways Tables)

Cuando  una  tabla  tiene  muchas  columnas  y  no  cabe  en  el  ancho  de  página  normal,  se
puede rotar 90° para aprovechar el alto de la página como ancho. Para ello se usa el entorno
sidewaystable del paquete rotating.

C.1.1.  Ejemplo de tabla rotada

El siguiente código genera una tabla que ocupa toda la página en horizontal:

Código de tabla rotada

1 \begin{sidewaystable}
2

\centering
\caption{Comparativa de características por módulo del sistema}
\label{tab:comparativa-modulos}
\begin{tabular}{lcccccccccc}

\toprule
\textbf{Módulo} & \textbf{Líneas} & \textbf{Clases} & ... \\
\midrule

 ...

3

4

5

6

7

8

9

10

\bottomrule

109

110

Técnicas Avanzadas de LATEX

\end{tabular}
11
12 \end{sidewaystable}

C.1.2.  Cuándo usar tablas rotadas

Las tablas rotadas son útiles cuando:

• La tabla tiene más de 8-10 columnas

• Los encabezados de columna son largos

• Se necesita mostrar datos comparativos extensos

• Una tabla horizontal no cabría sin reducir excesivamente el tamaño de fuente

LIGHTBULB  Alternativa: tabularray Para tablas complejas con celdas combinadas, considera usar
el paquete tabularray (ya incluido en la plantilla) en lugar de multirow/multicolumn,
ya que evita conflictos con colortbl en LuaLaTeX.

C.2.  Páginas en Horizontal (Landscape)

Para insertar páginas en orientación horizontal dentro de un documento vertical, KOMA-
Script ofrece una solución nativa que gestiona correctamente la orientación y el tamaño de
página en el PDF. Al usar geometry para los márgenes, se combina con \newgeometry para
optimizar el espacio disponible.

C.2.1.  Método recomendado: Comandos de la plantilla

La plantilla proporciona comandos simplificados para crear páginas landscape con headers

y footers correctamente dimensionados:

Código para página horizontal (método simplificado)

1 % Iniciar página landscape con margen de 2cm (valor por defecto)
2 \BeginLandscapePage[2cm]
3
4 % Contenido en landscape (puede ocupar varias páginas)
5 \section{Diagrama de arquitectura}
6 \begin{figure}[H]
\centering
7
% Diagrama TikZ o imagen amplia
\caption{Arquitectura del sistema}
\label{fig:arquitectura-landscape}

8

9

10
11 \end{figure}
12
13 % Restaurar orientación portrait
14 \EndLandscapePage

C.2.  Páginas en Horizontal (Landscape)

111

o
l
l
o
r
r
a
s
e
d

n
E

s

m
0
8
1

Check

Check

Check

s

m
5
4

s

m
2
1

s

m
3
2

Check

Check

Check

Check

Check

Check

–

s

m
8

s

m
2

s

m
5

s

m
0
5
3

s

m
0
2
1

s

m
1

–

B
M
8
2
1

B
M
6
5
2

B
M
2
9
1

B
M
4
8
3

B
M
4
6

B
M
2
1
5

B
M
6
9

B
M
8
6
7

B
M
8
2
1

B
M
2
3

–

a
i
d
e
M

a
t
l
A

a
i
d
e
M

a
j
a
B

a
j
a
B

a
j
a
B

a
j
a
B

a
t
l
A

a
i
d
e
M

a
j
a
B

–

%
4
9

%
1
9

%
8
8

%
2
7

%
6
9

%
8
9

%
5
8

%
2
8

%
0
9

%
0
0
1

%
7
8

9
8

0
2
1

6
5
1

9
8

7
6

5
4

8
3

8
7

2
5

4
3

5
4

7
6

8
9

4
3
1

2
3

8
1

4
2

6
5

8
2

5
1

2
1

8
1

5
2

5
4

8

5

6

4
1

9

4

0
5
4
.
2

0
0
2
.
3

0
0
1
.
4

0
0
6
.
5

0
0
8
.
1

0
8
9

0
0
2
.
1

0
0
8
.
2

0
0
5
.
1

0
5
6

n
ó
i
c
a
c
i
t
n
e
t
u
A

s
o
t
a
d

e
d

e
s
a
B

b
e
w
z
a
f
r
e
t
n
I

T
S
E
R

I
P
A

s
e
n
o
i
c
a
c
fi
i
t
o
N

é
h
c
a
C

s
a
c
i
r
t
é
m
y

s
g
o
L

o
t
n
e
i
m
a
s
e
c
o
r
P

n
ó
i
c
a
r
u
g
fi
n
o
C

n
ó
i
c
a
t
r
o
p
x
E

8
6
7

7
1
5

6
4
1

0
8
2
.
4
2

l
a
t
o
T

o
d
a
l
l
o
r
r
a
s
e
d

a
m
e
t
s
i
s

l
e
d

o
l

u
d
ó
m

r
o
p

s
a
c
i
t
s
í
r
e
t
c
a
r
a
c

e
d

a
t
e
l

p
m
o
c

a
v
i
t
a
r
a
p
m
o
C

:
1
.
C
a
l
b
a
T

o
d
a
t
s
E

a
i
c
n
e
t
a
L

a
i
r
o
m
e
M

d
a
d
i
j
e
l
p
m
o
C

a
r
u
t
r
e
b
o
C

s
t
s
e
T

s
e
n
o
i
c
n
u
F

s
e
s
a
l
C

s
a
e
n
L

í

o
l
u
d
ó
M

112

Técnicas Avanzadas de LATEX

Ventajas de este método:

• Sintaxis simple con solo dos comandos

• El visor PDF muestra la página rotada correctamente (dimensiones reales de página)

• Los márgenes se optimizan para aprovechar el espacio landscape

• Los encabezados y pies de página funcionan con normalidad

• Se puede usar para múltiples páginas consecutivas

C.2.  Páginas en Horizontal (Landscape)

113

C.2.2.  Diagrama de flujo del sistema (página horizontal)

Esta página está en orientación horizontal para mostrar un diagrama amplio. Los márgenes están optimizados para aprovechar el espacio disponible.

Inicio

Auten-
ticación

¿Válido?

Sí

Menú

Módulo B

Proceso

Resultado

Módulo A

No

Error

Módulo C

Sí

BD

¿Guar-
dar?

No

Fin

Figura C.1: Diagrama de flujo completo del sistema en página horizontal

Tabla C.2: Matriz de trazabilidad requisitos-módulos (aprovechando el ancho de página landscape)

RF01 RF02 RF03 RF04 RF05 RF06 RF07 RF08 RF09 RF10 RF11 RF12 RF13

•

•

Módulo A
Módulo B
Módulo C
Módulo D
Módulo E

•
•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

114

Técnicas Avanzadas de LATEX

C.2.3.  Segunda página horizontal consecutiva

Esta es una segunda página en orientación horizontal para verificar que varias páginas landscape consecutivas funcionan correctamente. Los encabezados

y pies de página deben mantenerse consistentes en ambas páginas.

Tabla C.3: Tabla adicional de ejemplo en segunda página landscape

ID

Descripción del requisito

Prioridad

Estado

RF01 El sistema debe permitir la autenticación de usuarios me-

Alta

Implementado

diante credenciales

RF02 El sistema debe registrar todas las acciones del usuario en

Media

Implementado

un log

RF03 El sistema debe generar informes en formato PDF
RF04 El sistema debe soportar múltiples idiomas
RF05 El  sistema  debe  integrarse  con  servicios  externos  vía  API

Alta
Baja
Alta

En progreso
Pendiente
Implementado

REST

RF06 El sistema debe validar todos los datos de entrada
RF07 El sistema debe proporcionar copias de seguridad automá-

Alta
Media

Implementado
En progreso

ticas

RF08 El sistema debe soportar diferentes roles de usuario

Alta

Implementado

Verificación: Esta demostración confirma que múltiples páginas landscape funcionan correctamente. Los números de página se incrementan normalmente,
los encabezados muestran la sección actual y los pies de página mantienen su formato.

C.3.  Inclusión de Documentos PDF Externos

115

C.2.4.  Cuándo usar páginas landscape

Las páginas en horizontal son apropiadas para:

• Diagramas de flujo o arquitectura complejos

• Cronogramas o diagramas de Gantt

• Matrices de trazabilidad

• Capturas de pantalla de aplicaciones

• Tablas muy anchas que no justifican rotación completa

C.3.  Inclusión de Documentos PDF Externos

El paquete pdfpages permite incluir páginas de documentos PDF externos en el documento

LATEX. Esto es útil para adjuntar:

• Artículos o papers de referencia

• Documentación técnica de terceros

• Certificados o autorizaciones

• Manuales de usuario existentes

• Hojas de datos (datasheets)

Exclamation-Triangle  Tamaño del documento Incluir PDFs externos aumenta significativamente el tamaño
del documento final. Considera comprimir los PDFs antes de incluirlos o enlazarlos como
anexos digitales separados si el tamaño es crítico.

C.3.1.  Sintaxis básica

Inclusión de PDF externo

1 % Incluir todas las páginas
2 \includepdf[pages=-]{ruta/documento.pdf}
3
4 % Incluir páginas específicas
5 \includepdf[pages={1,3,5-8}]{documento.pdf}
6
7 % Incluir con opciones
8 \includepdf[
 pages=-,
9
 scale=0.9,
 pagecommand={\thispagestyle{plain}}

10

11
12 ]{documento.pdf}

116

Técnicas Avanzadas de LATEX

C.3.2.  Opciones más utilizadas

Tabla C.4: Opciones principales de \includepdf

Opción

Descripción

pages=-
pages={1,3,5-8}
scale=0.9
landscape
nup=2x2

frame
pagecommand={}
addtotoc

Incluye todas las páginas
Incluye páginas específicas
Escala el documento (0.9 = 90%)
Rota las páginas 90 grados
Coloca varias páginas en una (2 filas × 2 colum-
nas)
Añade un marco alrededor de cada página
Comando a ejecutar en cada página incluida
Añade entrada al índice de contenidos

C.3.3.  Ejemplo: Documento PDF incluido

A continuación se incluye un documento PDF de ejemplo que ha sido generado indepen-

dientemente. Se incluyen sus dos páginas con un marco y una escala ligeramente reducida:

117

DocumentodeEjemploparaInclusiónGeneradoautomáticamente8defebrerode20261.IntroducciónEsteesundocumentoPDFdeejemploqueseincluiráeneltrabajoprincipalusandoelpaquetepdfpages.2.ContenidodeejemploLoremipsumdolorsitamet,consectetueradipiscingelit.Utpuruselit,vestibulumut,placeratac,adipiscingvitae,felis.Curabiturdictumgravidamauris.Namarculibero,nonummyeget,consectetuerid,vulputatea,magna.Donecvehiculaaugueeuneque.Pellentesquehabitantmorbitristiquesenectusetnetusetmalesuadafamesacturpisegestas.Maurisutleo.Crasviverrametusrhoncussem.Nullaetlectusvestibulumurnafringillaultrices.Phaselluseutellussitamettortorgravidaplacerat.Integersapienest,iaculisin,pretiumquis,viverraac,nunc.Praesentegetsemvelleoultricesbibendum.Aeneanfaucibus.Morbidolornulla,malesuadaeu,pulvinarat,mollisac,nulla.Curabiturauctorsempernulla.Donecvariusorciegetrisus.Duisnibhmi,congueeu,accumsaneleifend,sagittisquis,diam.Duisegetorcisitametorcidignissimrutrum.Namduiligula,fringillaa,euismodsodales,sollicitudinvel,wisi.Morbiauctorloremnonjusto.Namlacuslibero,pretiumat,lobortisvitae,ultricieset,tellus.Donecaliquet,tortorsedaccumsanbibendum,eratligulaaliquetmagna,vitaeornareodiometusami.Morbiacorcietnislhendreritmollis.Suspendisseutmassa.Crasnecante.Pellentesqueanulla.Cumsociisnatoquepenatibusetmagnisdisparturientmontes,nasceturridiculusmus.Aliquamtincidunturna.Nullaullamcorpervestibulumturpis.Pellentesquecursusluctusmauris.3.DatostécnicosFormato:A4Márgenes:2.5cmCompilador:LuaLaTeXNullamalesuadaporttitordiam.Donecfeliserat,conguenon,volutpatat,tincidunttristique,libero.Vivamusviverrafermentumfelis.Donecnonummypellentesqueante.Phasellusadipiscingsemperelit.Proinfermentummassaacquam.Seddiamturpis,molestievitae,placerata,molestienec,leo.Maecenaslacinia.Namipsumligula,eleifendat,accumsannec,suscipita,ipsum.Morbiblanditligulafeugiatmagna.Nunceleifendconsequatlorem.Sedlacinianullavitaeenim.Pellentesquetinciduntpurusvelmagna.Integernonenim.Praesenteuismodnunceupurus.Donecbibendumquamintellus.Nullamcursuspulvinarlectus.Donecetmi.Namvulputatemetuseuenim.Vestibulumpellentesquefeliseumassa.1118

4.SegundapáginaQuisqueullamcorperplaceratipsum.Crasnibh.Morbiveljustovitaelacustinciduntultrices.Loremipsumdolorsitamet,consectetueradipiscingelit.Inhachabitasseplateadictumst.Integertempusconvallisaugue.Etiamfacilisis.Nuncelementumfermentumwisi.Aeneanplacerat.Utimperdiet,enimsedgravidasollicitudin,felisodioplaceratquam,acpulvinarelitpurusegetenim.Nuncvitaetortor.Prointempusnibhsitametnisl.Vivamusquistortorvitaerisusportavehicula.Fuscemauris.Vestibulumluctusnibhatlectus.Sedbibendum,nullaafaucibussemper,leovelitultriciestellus,acvenenatisarcuwisivelnisl.Vestibulumdiam.Aliquampellentesque,auguequissagittisposuere,turpislacusconguequam,inhendreritrisuserosegetfelis.Maecenasegeteratinsapienmattisporttitor.Vestibulumporttitor.Nullafacilisi.Sedaturpiseulacuscommodofacilisis.Morbifringilla,wisiindignissiminterdum,justolectussagittisdui,etvehiculaliberoduicursusdui.Mauristemporligulasedlacus.Duiscursusenimutaugue.Crasacmagna.Crasnulla.Nullaegestas.Curabituraleo.Quisqueegestaswisiegetnunc.Namfeugiatlacusvelest.Curabiturconsectetuer.Suspendissevelfelis.Utloremlorem,interdumeu,tinciduntsitamet,laoreetvitae,arcu.Aeneanfaucibuspedeeuante.Praesentenimelit,rutrumat,molestienon,nonummyvel,nisl.Utlectuseros,malesuadasitamet,fermentumeu,sodalescursus,magna.Doneceupurus.Quisquevehicula,urnasedultriciesauctor,pedeloremegestasdui,etconvalliseliteratsednulla.Donecluctus.Curabituretnunc.Aliquamdolorodio,commodopretium,ultriciesnon,pharetrain,velit.Integerarcuest,nonummyin,fermentumfaucibus,egestasvel,odio.2C.4.  Figuras de Ancho Completo

119

C.3.4.  Múltiples páginas en una hoja

Para ahorrar espacio, se pueden incluir varias páginas del PDF en una sola hoja del docu-

mento:

1 \includepdf[
 pages=-,
2
 nup=1x2,
 landscape,
 frame,

4

3

5
6 ]{documento.pdf}

Varias páginas PDF en una hoja

% 1 columna, 2 filas
% Orientación horizontal
% Marco visible

C.4.  Figuras de Ancho Completo

A veces es necesario que una figura ocupe todo el ancho de la página, incluso invadiendo

los márgenes. Para ello se combina el entorno figure* con ajustes de geometría.

C.4.1.  Figura que invade márgenes

Figura de ancho completo

1 \begin{figure}[H]
\centering
2
\makebox[\textwidth][c]{%

3

4

5

6

\includegraphics[width=1.2\textwidth]{imagen_ancha}

}
\caption{Imagen que ocupa más que el ancho del texto}
\label{fig:imagen-ancha}

7
8 \end{figure}

C.5.  Notas al Margen

Las notas al margen son útiles para añadir comentarios breves sin interrumpir el flujo del

texto principal.

C.5.1.  Uso básico

1 Texto principal del párrafo.\marginpar{Nota breve al margen}

Notas al margen

Este es un ejemplo de texto con una nota al margen.
Las notas al margen se colocan automáticamente en el lado exterior de la página (derecho

en páginas impares, izquierdo en pares) cuando se usa impresión a doble cara.

Esta
es
una  nota  al
margen
con
información
adicional.

120

Técnicas Avanzadas de LATEX

C.6.  Marcas de Agua

Para documentos en borrador o confidenciales, se pueden añadir marcas de agua usando el

paquete draftwatermark o background.

Marca de agua con draftwatermark

1 % En el preámbulo:
2 \usepackage{draftwatermark}
3 \SetWatermarkText{BORRADOR}
4 \SetWatermarkScale{1.5}
5 \SetWatermarkColor[gray]{0.9}

C.7.  Texto en Columnas

Para secciones específicas que requieran formato en múltiples columnas (como glosarios o

listas de referencias), se puede usar el entorno multicols:

Texto en dos columnas

1 \begin{multicols}{2}
2
3 \end{multicols}

 Contenido distribuido en dos columnas...

C.7.1.  Ejemplo de texto en columnas

Términos de red:

• Router

• Switch

• Firewall

• Gateway

• DNS Server

• DHCP Server

Protocolos:

• TCP/IP

• HTTP/HTTPS

• FTP/SFTP

• SSH

• SMTP

• DNS

C.8.  Minipáginas y Cajas

Las minipáginas permiten crear bloques de contenido lado a lado:

Dos minipáginas lado a lado

1 \begin{minipage}[t]{0.45\textwidth}
2

 Contenido izquierdo...

C.9.  Resumen de Paquetes Utilizados

121

3 \end{minipage}
4 \hfill
5 \begin{minipage}[t]{0.45\textwidth}
6
7 \end{minipage}

 Contenido derecho...

C.8.1.  Ejemplo de minipáginas

Ventajas del sistema:

Limitaciones conocidas:

• Alta disponibilidad

• Requiere conexión a Internet

• Escalabilidad horizontal

• No compatible con IE11

• Bajo coste de mantenimiento

• Máximo 1000 usuarios simultáneos

• Interfaz intuitiva

• Sin soporte para móviles legacy

• Documentación completa

• Idiomas: solo ES/EN

C.9.  Resumen de Paquetes Utilizados

Tabla C.5: Paquetes y comandos LATEX para técnicas avanzadas

Paquete/Clase

Uso

Comando principal

rotating
KOMA-Script
pdfpages
multicol
geometry
scrlayer-scrpage Encabezados/pies
draftwatermark

Tablas rotadas
Páginas landscape
Incluir PDFs
Múltiples columnas
Márgenes personalizados

Marcas de agua

\begin{sidewaystable}
\KOMAoptions{paper=landscape}
\includepdf[options]{file}
\begin{multicols}{n}
\newgeometry{...}
Configuración KOMA
\SetWatermarkText{...}

