# AGENTS.md — Boleia (Angola)

## Project

- Expo (SDK ~54) + React Native 0.81.5 + React 19.1.0 + TypeScript ~5.9.2
- App name: `boleia` (mobilidade partilhada interprovincial, demo mock)
- New architecture enabled (`newArchEnabled: true` in app.json)
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

Run order: `npm ci` → `typecheck` → `lint` → `format:check` → `doctor` (allow fail). No test suite exists.

## Architecture

- **Entry point**: `index.ts` → `App.tsx` → `RootNavigator` (`src/navigation/RootNavigator.tsx`)
- **Routing**: React Navigation native-stack, three-level hierarchy:
    - `RootNavigator` → `SplashScreen` → `OnboardingScreen` → `BoleiaAuthNavigator` → `BoleiaMainNavigator`
    - `BoleiaAuthNavigator`: `Login` → `Register`/`ForgotPassword` → `OtpVerify` (só recuperação de senha) → `ResetPassword` → `ProfileSetup`
    - `BoleiaMainNavigator`: tabs (`PassengerTabs` / `DriverTabs`) + stack `Kyc`, `Vehicle`, `PublishTrip`, `RideDetail`, `PublicProfile`, `ActiveRide`, `Review`, `SosCenter`, `Notifications`
- **Styling**: NativeWind (Tailwind CSS for RN). Import `'./global.css'` in `App.tsx`. Metro config wired via `withNativeWind()`.
- **Custom theme colors** (`src/store/colors.ts` + tailwind.config.js): `primary` (#F2A900), `secondary`, `laterite` (#B4531F), `mato`, `error`, `border`, `card`, `background`, `text`
- **State management**: Zustand for local state. Server state is **mock** — `src/mock/db.ts` (persist em AsyncStorage) + `src/mock/repos/*` (repositórios síncronos). React Query exists but the demo não usa API real.
- **Mock layer**: `src/mock/` — `db.ts` (zustand persist), `seed.ts` (dataset Angola), `locale.ts` (municípios/rotas), `helpers.ts`, `repos/` (`authRepo`, `driverRepo`, `rideRepo`, `bookingRepo`, `reviewRepo`, `liveRepo`)
- **Simulação "ao vivo"**: `liveRepo.startRide` põe a viagem `em_curso`; `advanceLive` avança `vinculos` por intervalo (7s no `BoleiaMainNavigator`) e `finalizeRide` conclui as reservas e credita o motorista (90% do valor).
- **Pagamentos**: `carteira` (desconto/refund), `dinheiro` (ao motorista). **`multicaixa`/MCX é placeholder ("Em breve")** — bloqueado na UI de `RideDetailScreen`, não chega ao repo.
- **Source tree**: `src/{components,hooks,lib,mock,navigation,screens,store,types,utils}` (não existe `src/api/` — o cliente usa o mock)

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
- **Demo login**: tel `923456789` / senha `123456` (todos os utilizadores do seed). `mockHash` (djb2) em `authRepo` guarda as senhas como hash mock.
- **Demo OTP**: código fixo `773214` (ver `ForgotPasswordScreen`/`OtpVerifyScreen`), usado só na recuperação de senha.
- **Troca de papel** (passageiro ↔ motorista) só no ecrã de Perfil ("Modo de uso").
- **Homepage**: carrossel `AdCarousel` (publicidade, imagens placeholder) + pesquisa `TripSearch` (intermunicipal/interprovincial, origem/destino, dia) com resultados inline.
- **No `.env` files** committed. Use `.env` + `.env.local` (gitignored) for secrets.
