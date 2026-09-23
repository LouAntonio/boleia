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
- **Custom theme colors** (`src/store/colors.ts` + tailwind.config.js): `primary` (#F2A900), `secondary`, `laterite` (#B4531F), `mato`, `error`, `border`, `card`, `background`, `text`
- **State management**: Zustand para estado local. Autenticação e account usam **API real** (`src/lib/api.ts`, axios) contra o backend NestJS (`API_URL` via react-native-dotenv). Viagens, reservas e reviews continuam **mock** — `src/mock/db.ts` (persist em AsyncStorage) + `src/mock/repos/*` (repositórios síncronos).
- **Mock layer**: `src/mock/` — `db.ts` (zustand persist), `seed.ts` (dataset Angola), `locale.ts` (21 províncias, ~306 municípios reais — sem coordenadas por município; `PROVINCE_COORDS` por província para estimar distâncias), `helpers.ts`, `repos/` (`authRepo`, `driverRepo`, `rideRepo`, `bookingRepo`, `reviewRepo`, `liveRepo`)
- **Simulação "ao vivo"**: `liveRepo.startRide` põe a viagem `em_curso`; `advanceLive` avança `vinculos` por intervalo (7s no `BoleiaMainNavigator`) e `finalizeRide` conclui as reservas e credita o motorista (90% do valor).
- **Pagamentos**: `carteira` (desconto/refund), `dinheiro` (ao motorista). **`multicaixa`/MCX é placeholder ("Em breve")** — bloqueado na UI de `RideDetailScreen`, não chega ao repo.
- **Source tree**: `src/{components,hooks,lib,mock,navigation,screens,store,types,utils}`. Cliente HTTP em `src/lib/api.ts` (axios; auth/account reais). O resto da app usa o mock.

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
- **Homepage**: carrossel `AdCarousel` (publicidade, imagens placeholder) + pesquisa `TripSearch` (intermunicipal/interprovincial, origem/destino, dia) com resultados inline.
- **No `.env` files** committed. Use `.env` + `.env.local` (gitignored) for secrets.
