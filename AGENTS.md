# AGENTS.md — Boleia (Angola)

## Project

- Expo SDK 57 + React Native 0.86.3 + React 19.2.3 + TypeScript ~6.0.3
- App name: `boleia` (mobilidade partilhada interprovincial)
- New architecture ativada (default no SDK 57 — o campo `newArchEnabled` foi removido do schema do app.json)
- Single-package app (not a monorepo)

## Developer commands

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm start`            | Launch Expo dev server           |
| `npm run android`      | Start on Android emulator/device |
| `npm run ios`          | Start on iOS simulator/device    |
| `npm run web`          | Start in browser (Metro bundler) |
| `npm run typecheck`    | `tsc --noEmit`                   |
| `npm run lint`         | `eslint .`                       |
| `npm run lint:fix`     | `eslint . --fix`                 |
| `npm run format`       | `prettier . --write`             |
| `npm run format:check` | `prettier . --check`             |
| `npm run doctor`       | `expo-doctor` (config health)    |

## CI pipeline (`.github/workflows/ci.yml`)

Run order: `npm ci` → `typecheck` → `lint` → `format:check` → `doctor` (allow fail). No test suite exists. `npm run cipipe` corre `format:check` → `lint` → `typecheck` → `doctor` (atualmente tudo verde).

## Architecture

- **Entry point**: `index.ts` → `App.tsx` → `RootNavigator` (`src/navigation/RootNavigator.tsx`)
- **Routing**: React Navigation native-stack, three-level hierarchy:
    - `RootNavigator` → `SplashScreen` → `OnboardingScreen` → `BoleiaAuthNavigator` → `BoleiaMainNavigator`
    - `BoleiaAuthNavigator`: `Login` → `Register`/`ForgotPassword` → `OtpVerify` (OTP «signup» ou «reset», enviado por WhatsApp via backend) → `ResetPassword` → `ProfileSetup`
    - `BoleiaMainNavigator`: tabs (`PassengerTabs` / `DriverTabs`) + stack `Kyc`, `Vehicle`, `PublishTrip`, `RideDetail`, `PublicProfile`, `ActiveRide`, `Review`, `SosCenter`, `Notifications`
- **Styling**: NativeWind (Tailwind CSS for RN). Import `'./global.css'` in `App.tsx`. Metro config wired via `withNativeWind()`.
- **Design system**: modelo semântico Pixar/BlaBlaCar. Tokens em `src/store/colors.ts` (cores), `src/store/type.ts` (escala), `tailwind.config.js` (classes). Regra de emparelhamento obrigatória: `text` só sobre surfaces normais; sobre `primary`/`success`/`laterite`/`caution` usa-se sempre o token `on*` correspondente (`onPrimary`, `onSuccess`, `onWarning`, `cautionText`) — nunca `text` ou branco hardcoded. Validar com `node scripts/contrast.js`.
- **Cores**: `background` #F5F7FB, `card` #FFFFFF, `text` #001536, `secondary` #576680, `primary` #0071EB, `laterite` #B84412, `mato`/`success` #107046, `caution` #FFCC56, `error` #BA303B (tema escuro tem variantes próprias). `mato` é alias legado de `success`.
- **Tipografia**: uma só família, **Hanken Grotesk** 400/500/700/800 (`font-sans`, `sansMedium`, `sansBold`, `sansExtraBold`). Sem monoespaçada, sem `font-display`, sem `uppercase`/`tracking` em labels. Escala: `titlePrimary` 28/31, `titleSecondary` 22/24, `titleTertiary` 18/20, `label` 16/18, `labelSmall` 14/16, `body` 16/19, `bodySmall` 14/17, `bodyXSmall` 12/17, `numberLarge` 40/44. Wordmark do Splash é a única excepção de tamanho (`text-[56px]`).
- **Sem gramática de bilhete**: `TicketCard`, `Perforation`, `Eyebrow`, `QRStamp` e `HistoryReceipt` foram eliminados. Superfícies neutras via `Card`; títulos via `SectionTitle`; rótulos via `GroupLabel`; banda de estado via `StatusStamp`/`StatusPill` (sempre com rótulo, nunca só cor).
- **State management**: Zustand para estado local. Autenticação, account, **KYC (passageiro + motorista), viaturas, localidades, contacto de emergência e publicação de corridas** usam **API real** (`src/lib/api.ts`, axios) contra o backend NestJS (`API_URL` via react-native-dotenv). Pesquisa/listagem de viagens, reservas, reviews e acompanhamento ao vivo continuam **mock** — `src/mock/db.ts` (persist em AsyncStorage) + `src/mock/repos/*` (repositórios síncronos).
- **Mock layer**: `src/mock/` — `db.ts` (zustand persist), `seed.ts` (dataset Angola), `locale.ts` (21 províncias, ~306 municípios reais — sem coordenadas por município; `PROVINCE_COORDS` por província para estimar distâncias), `helpers.ts`, `repos/` (`authRepo`, `driverRepo`, `rideRepo`, `bookingRepo`, `reviewRepo`, `liveRepo`)
- **Simulação "ao vivo"**: `liveRepo.startRide` põe a viagem `em_curso`; `advanceLive` avança `vinculos` por intervalo (7s no `BoleiaMainNavigator`) e `finalizeRide` conclui as reservas e credita o motorista (90% do valor).
- **Pagamentos**: `carteira` (desconto/refund), `dinheiro` (ao motorista). **`multicaixa`/MCX é placeholder ("Em breve")** — bloqueado na UI de `RideDetailScreen`, não chega ao repo.
- **Source tree**: `src/{components,hooks,lib,mock,navigation,screens,store,types,utils}`. Cliente HTTP em `src/lib/api.ts` (axios; auth/account/KYC/viaturas/localidades/emergência/corridas reais); elegibilidade real em `src/lib/eligibility.ts` (gates de pedir/registar corrida). O resto da app usa o mock.
- **KYC obrigatório (real)**: passageiro precisa `kycPassenger=VERIFIED` (nome + BI frente/verso + ≥2 selfies + corpo inteiro) para pedir; motorista precisa `kycDriver=VERIFIED` + ≥1 viatura `VERIFIED` para publicar (`KycScreen` tem modo passageiro/motorista, upload real via Cloudinary). `driverRepo.submitKyc/submitVehicle` são legado do demo.

## Style conventions

- Prettier config: tabs, tabWidth=4, single quotes, trailing commas, semicolons
- ESLint: extends `@react-native`
- Microcopy em PT-AO ("Entra", "verifica o teu BI", "bater certo")
- Ecrãs de detalhe Boleia usam Header com botão `chevron-back` e scroll `px-5`

## Quirks & gotchas

- **`/android` and `/ios` are gitignored**: this is a prebuild / CNG workflow. Run `npx expo prebuild` to regenerate native directories. Do NOT commit native folders.
- **Expo Updates** configured with OTA URL and `appVersion` runtime policy. EAS project ID in `app.json` but no `eas.json` committed yet.
- **No test framework** is configured. If adding tests, use Jest + React Native Testing Library (the `@react-native` ESLint config assumes this convention).
- **DB mock persistida** em AsyncStorage (`boleia-db`, versão `DB_VERSION`). Mudanças de schema em `seed.ts` exigem incrementar `DB_VERSION` ou reset para re-semear.
- **Auth (API real)**: phone-first — sign-up exige OTP obrigatório entregue por WhatsApp (backend), senha mín. 8. Token Bearer guardado em SecureStore (chave `boleia.authToken`); o interceptor do axios captura o header `set-auth-token` e injeta `Authorization: Bearer`. 401 → limpa token + `signOut`. Sessão iniciada com `appStore.signIn(userId)` (backend devolve o userId).
- **Demo/mock**: contas mock só para dados de viagens (Lourenço António `930673691`/`u_me_001`, Ariclene Queta `923151445`/`u_002`, Fernando Macana `925550473`/`u_003`). `useSessionUserId()`/`useSessionUser()` (`src/hooks/useSessionUser.ts`, fallback `u_me_001`); `mockHash` (djb2) em `authRepo` é legado — a autenticação real já não o usa.
- **Troca de papel** (passageiro ↔ motorista) só no ecrã de Perfil ("Modo de uso").
- **Homepage**: sem publicidade. `TripSearch` (intermunicipal/interprovincial, origem/destino, dia) com resultados inline e pesquisas recentes (`src/lib/recentSearches.ts`, AsyncStorage, máx. 5, só local).
- **Publicar viagem**: wizard de **3 passos** (Rota e dia → Preço e viatura → Rever) em `PublishTripScreen`; mantém a mesma `publish()` e o mesmo payload.
- **No `.env` files** committed. Use `.env` + `.env.local` (gitignored) for secrets.
