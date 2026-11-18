# Handoff: 20261118-licenca-proprietaria

- Data: 2026-11-18
- Frente: C43 do cert4all (diligência de investidor), item 3 da revisão de 18/11

## O que mudou

O repositório é público (os produtos instalam o kit por `github:cert4all/ui#<sha>`) e não tinha licença: para quem
olha de fora, isso é ambíguo. Agora: `LICENSE` proprietária da Cert4All, com a nota de que a visibilidade não concede
licença; `"license": "UNLICENSED"` no `package.json` e no lockfile; `scripts/check-licenca.sh` (o mesmo do playbook) no
`.githooks/pre-commit`, com a prova `scripts/testar-check-licenca.sh` (10 casos).

Nada muda para os produtos: eles fixam um commit do kit, e o pacote publicado só leva `src` (o npm inclui o LICENSE).

## Aberto (owner)

Tornar o repositório privado é decisão do owner: antes, conferir que cada lugar que roda `npm ci` dos produtos (VM dev,
runner do CI, VPS) alcança o GitHub com chave. Até lá, fica público com licença proprietária.

## Verificação

- `scripts/check-licenca.sh`: 3 antes, 0 depois. `scripts/testar-check-licenca.sh`: 10/10.
