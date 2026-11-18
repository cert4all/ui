#!/usr/bin/env bash
#
# Prova do scripts/check-licenca.sh (C43, item 2): passa no caso certo e reprova (exit 3) em cada jeito de o código
# deixar de se declarar proprietário. Roda num repositório descartável em $TMPDIR, nunca na árvore real.
#
# ⚠️ Chamado de dentro de um hook, o git herda GIT_DIR/GIT_INDEX_FILE e agiria no repositório REAL. Por isso o unset
# abaixo e a conferência do toplevel antes de qualquer escrita.
set -uo pipefail
unset $(git rev-parse --local-env-vars 2>/dev/null) 2>/dev/null || true

GUARDA="$(cd "$(dirname "$0")" && pwd)/check-licenca.sh"
LAB="$(mktemp -d "${TMPDIR:-/tmp}/testar-licenca.XXXXXX")"
trap 'rm -rf "$LAB"' EXIT
cd "$LAB" || exit 2
git init -q . && git config user.email t@t && git config user.name t
[ "$(git rev-parse --show-toplevel)" = "$(pwd -P)" ] || { echo "ABORTANDO: toplevel nao e' o laboratorio"; exit 2; }

falhou=0
ok()  { echo "  ok   $1"; }
nao() { echo "  FALHA $1"; falhou=1; }

proprietaria='Copyright (c) 2026 Cert4All Tecnologia Ltda.
Todos os direitos reservados.'
mit='MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy'

caso() {  # $1 = nome, $2 = exit esperado; o estado do índice já foi montado
  "$GUARDA" "$LAB" >/dev/null 2>&1; local c=$?
  [ "$c" -eq "$2" ] && ok "$1 (exit $c)" || nao "$1: esperado $2, veio $c"
}
montar() {  # $1 = texto do LICENSE ("" = sem arquivo), $2 = license do package.json raiz ("" = ausente), $3 = license do sub ("-" = sem sub)
  git rm -rq --cached . >/dev/null 2>&1; rm -rf ./*
  [ -n "$1" ] && printf '%s\n' "$1" > LICENSE
  if [ -n "$2" ]; then printf '{"name":"x","license":"%s"}\n' "$2" > package.json; else printf '{"name":"x"}\n' > package.json; fi
  if [ "$3" != "-" ]; then mkdir -p apps/a; printf '{"name":"a","license":"%s"}\n' "$3" > apps/a/package.json; fi
  mkdir -p node_modules/dep && printf '{"name":"dep","license":"MIT"}\n' > node_modules/dep/package.json
  git add -A -f
}

echo "== check-licenca =="
montar "$proprietaria" UNLICENSED UNLICENSED;            caso "proprietaria e UNLICENSED em tudo passa (node_modules MIT ignorado)" 0
montar "$proprietaria" "SEE LICENSE IN LICENSE" -;       caso "SEE LICENSE IN LICENSE tambem passa" 0
montar "$proprietaria" MIT -;                            caso "package.json raiz com MIT reprova" 3
montar "$proprietaria" "" -;                             caso "package.json sem campo license reprova" 3
montar "$proprietaria" UNLICENSED ISC;                   caso "sub-pacote com ISC reprova" 3
montar "" UNLICENSED -;                                  caso "sem LICENSE reprova" 3
montar "$mit" UNLICENSED -;                              caso "LICENSE com texto MIT reprova" 3
montar "Copyright Cert4All" UNLICENSED -;                caso "LICENSE sem 'Todos os direitos reservados' reprova" 3
montar "$proprietaria" UNLICENSED -; printf 'nao e json' > package.json; git add package.json
                                                         caso "package.json invalido = nao conseguiu rodar" 2
# o guarda lê o ÍNDICE: arquivo corrigido no disco e não adicionado continua reprovando
montar "$proprietaria" MIT -; printf '{"name":"x","license":"UNLICENSED"}\n' > package.json
                                                         caso "corrigido so' no disco (fora do indice) continua reprovando" 3

echo
[ "$falhou" -eq 0 ] && { echo "RESULTADO: check-licenca prova os 10 casos."; exit 0; } || { echo "RESULTADO: falhou."; exit 3; }
