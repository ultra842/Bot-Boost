# ZIMO STORE Bot

Um bot de Discord para gerenciar recompensas de boost com verificação de **2x Booster**, entrega automática de key e bloqueio de novos benefícios após o resgate.

## Configuração

- Preencha o arquivo `.env`:
  - `TOKEN`: token do bot.
  - `GUILD_ID`: ID do servidor.
  - `BOOSTER_ROLE_ID`: ID do papel de Booster (ou deixe em branco para usar `premiumSince`).
  - `TWOX_ROLE_ID`: ID do papel de 2x Booster (necessário para liberar a recompensa).
  - `CLAIMED_ROLE_ID`: papel aplicado após resgate para bloquear benefícios futuros.
  - `SUPPORT_URL`: link de suporte.

- Coloque suas keys no arquivo `entregar.txt`, uma por linha.

## Rodando

```bash
npm start
```

## Comandos

- `.setup` — publica o painel bonito com botões de resgate.
- `.grant2x @usuario` — concede o papel de 2x Booster (admin com Gerenciar Papéis).
- `.revoke2x @usuario` — remove o papel de 2x Booster.

## Fluxo de Resgate

1. Usuário clica em "Resgatar Recompensa" no painel.
2. Bot verifica se o usuário está boostando e possui o papel 2x Booster.
3. Entrega uma key (primeira linha de `entregar.txt`) por DM e remove-a do arquivo.
4. Marca o usuário em `claimed.json` e aplica `CLAIMED_ROLE_ID`.
5. Usuário não consegue resgatar novamente.

## Observações

- A API do Discord não informa quantos boosts cada usuário aplicou. O papel `2x Booster` serve como validação adicional gerenciada pela staff.
- Caso o usuário não permita DMs, o bot responde com a key de forma ephemera no servidor.