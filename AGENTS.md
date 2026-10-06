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
- **Cores**: `background` #F5F7FB, `card` #FFFFFF, `text` #001536, `secondary` #576680, `primary` #0071EB, `laterite` #B84412, `success` #107046, `caution` #FFCC56, `error` #BA303B (tema escuro tem variantes próprias). O alias legado `mato` foi removido — usar sempre `success`.
- **`laterite` é exclusivamente warning/bg/strong**: nunca como cor de texto, acento ou avatar. Rótulo/meta vai a `secondary`, acção/estado activo a `primary`, rail de rota origem=`text`/destino=`primary`, anel de avatar a `border`+`accentWeak`. Os únicos usos legítimos são bandas de estado (`band={themeColors.laterite}`), `ActivityIndicator` e o `tone="warning"` real.
- **Tipografia**: uma só família, **Hanken Grotesk** 400/500/700/800 (`font-sans`, `sansMedium`, `sansBold`, `sansExtraBold`). Sem monoespaçada, sem `font-display`, sem `uppercase`/`tracking` em labels. Escala: `titlePrimary` 28/31, `titleSecondary` 22/24, `titleTertiary` 18/20, `label` 16/18, `labelSmall` 14/16, `body` 16/19, `bodySmall` 14/17, `bodyXSmall` 12/17, `numberLarge` 40/44. Wordmark do Splash é a única excepção de tamanho (`text-[56px]`).
- **Sem gramática de bilhete**: `TicketCard`, `Perforation`, `Eyebrow`, `QRStamp` e `HistoryReceipt` foram eliminados. Superfícies neutras via `Card`; títulos via `SectionTitle`; rótulos via `GroupLabel`; banda de estado via `StatusStamp`/`StatusPill` (sempre com rótulo, nunca só cor).
- **Botão de voltar**: usar sempre o componente partilhado `src/components/BackButton.tsx` (`<BackButton onPress={...} />`). Não duplicar o `Pressable` com `chevron-back`.
- **Alvos de toque**: mínimo 44×44 (`MIN_TAP` em `src/store/type.ts`). Em controlos circulares menores, alargar com `hitSlop` em vez de inchar a métrica visual — calcular por `ceil((44 - px) / 2)` e confirmar que a folga entre vizinhos (ex.: ticks do relógio, `2·R·sin(π/n)`) continua maior que `2·hitSlop`.
- **State management**: Zustand para estado local. **Todos** os dados vêm da API real (`src/lib/api.ts`, axios) contra o backend NestJS (`API_URL` via react-native-dotenv). Não existe camada mock.
- **Tempo real**: WebSocket `socket.io` no namespace `/trips` (`src/lib/socket.ts`). Autenticação por `handshake.auth.token` (o mesmo Bearer do REST, lido do SecureStore). Salas `ride:<id>`; eventos `ride:snapshot`, `ride:started`, `ride:progress`, `ride:finished`, `ride:cancelled`, `booking:created`, `booking:decided`, `booking:cancelled`. As chaves têm de coincidir com `RideEvent` em `back/src/rides/ride-events.ts`.
- **Push**: Expo Push Service. `src/hooks/usePushRegistration.ts` regista o token em `POST /api/push/devices` quando há sessão e a permissão já foi concedida; a permissão é pedida no ecrã de notificações, nunca ao arrancar. O backend invalida tokens com `DeviceNotRegistered`.
- **Fonte tree**: `src/{components,hooks,lib,navigation,screens,store,types,utils}`. Cliente HTTP em `src/lib/api.ts`; adaptadores de domínio em `src/lib/rideMapper.ts` (`toRide`, `toBooking`, `rideProgressFraction`); formatadores puros em `src/lib/format.ts`; localidades por API em `src/hooks/useLocalities.ts` (com cache de 24h). React Query para toda a leitura remota.
- **Ecrãs sem backend**: `ReviewScreen`, `SosCenterScreen` e `PublicProfileScreen` mantêm-se na navegação e dizem explicitamente que a funcionalidade ainda não existe. Não inventar notas, avaliações, alertas SOS nem perfis: sem endpoint, a app não mostra o dado.
- **Pagamentos**: a v1 só usa `dinheiro` (CASH). `WALLET` e `MULTICAIXA` existem no esquema do backend mas sem carteira nem integração Multicaixa, por isso não são oferecidos na UI. `PaymentKind` mapeia `CASH → 'dinheiro'` em `rideMapper.ts`.
- **Source tree**: `src/{components,hooks,lib,navigation,screens,store,types,utils}`. Cliente HTTP em `src/lib/api.ts`; elegibilidade real em `src/lib/eligibility.ts` (gates de pedir/registar corrida). Não reintroduzir `src/mock/`.
- **KYC obrigatório (real)**: passageiro precisa `kycPassenger=VERIFIED` (nome + BI frente/verso + ≥2 selfies + corpo inteiro) para pedir; motorista precisa `kycDriver=VERIFIED` + ≥1 viatura `VERIFIED` para publicar (`KycScreen` tem modo passageiro/motorista, upload real via Cloudinary). Os gates são validados também no servidor.

## Style conventions

- Prettier config: tabs, tabWidth=4, single quotes, trailing commas, semicolons
- ESLint: extends `@react-native`
- Microcopy em PT-AO ("Entra", "verifica o teu BI", "bater certo")
- Ecrãs de detalhe Boleia usam Header com botão `chevron-back` e scroll `px-5`

## Quirks & gotchas

- **`/android` and `/ios` are gitignored**: this is a prebuild / CNG workflow. Run `npx expo prebuild` to regenerate native directories. Do NOT commit native folders.
- **Expo Updates** configured with OTA URL e política `appVersion`. `eas.json` com perfis `development`/`preview`/`production`; `APP_ENV` decide que ficheiro `.env.*` o `react-native-dotenv` carrega (a biblioteca já resolve `.env` < `.env.local` < `.env.<APP_ENV>` < `.env.<APP_ENV>.local`).
- **Identidade**: `android.package` e `ios.bundleIdentifier` são `ao.boleia.app`. Alterá-los depois de publicar na Play Store/App Store cria uma app nova, não uma actualização.
- **No test framework** is configured. If adding tests, use Jest + React Native Testing Library (the `@react-native` ESLint config assumes this convention).
- **Auth (API real)**: phone-first — sign-up exige OTP obrigatório entregue por WhatsApp (backend), senha mín. 8. Token Bearer guardado em SecureStore (chave `boleia.authToken`); o interceptor do axios captura o header `set-auth-token` e injeta `Authorization: Bearer`. 401 → limpa token + `signOut`. Sessão iniciada com `appStore.signIn(userId)` (backend devolve o userId). `useSessionUserId()` devolve `null` sem sessão — nunca um id de recurso.
- **`GET /api/rides` devolve o array puro e o total em `X-Total-Count`.** O CORS do backend expõe esse cabeçalho; se for retirado, a app perde a contagem de resultados.
- **Fuso**: o backend interpretou e devolve as horas de paragem em WAT (UTC+1). Não recalcular nem converter para UTC no cliente.
- **Troca de papel** (passageiro ↔ motorista) só no ecrã de Perfil ("Modo de uso").
- **Homepage**: sem publicidade. `TripSearch` (intermunicipal/interprovincial, origem/destino, dia) com resultados inline e pesquisas recentes (`src/lib/recentSearches.ts`, AsyncStorage, máx. 5, só local).
- **Publicar viagem**: wizard de **3 passos** (Rota e dia → Preço e viatura → Rever) em `PublishTripScreen`. Publica só pela API; não existe espelho local.
- **No `.env` files** committed, excepto `.env.example` e `.env.production.example`. Use `.env` + `.env.local` (gitignored) for secrets. Produção tem de ser HTTPS.
