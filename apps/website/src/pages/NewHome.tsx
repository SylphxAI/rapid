import { Comparison } from '../components/Comparison.tsx';
import { EcosystemIntegrations } from '../components/EcosystemIntegrations.tsx';
import { Features } from '../components/Features.tsx';
import { GetStarted } from '../components/GetStarted.tsx';
import { InteractiveDemo } from '../components/InteractiveDemo.tsx';
import { MigrationPaths } from '../components/MigrationPaths.tsx';
import { NewHero } from '../components/NewHero.tsx';
import { StandalonePackages } from '../components/StandalonePackages.tsx';

export function NewHome() {
  return (
    <div>
      {/* 1. Hero - 立即展示價值主張 */}
      <NewHero />

      {/* 2. Interactive Demo - 體驗響應式 */}
      <InteractiveDemo />

      {/* 3. Features - 核心優勢 */}
      <Features />

      {/* 4. Migration Paths - 降低遷移障礙 */}
      <MigrationPaths />

      {/* 5. Standalone Packages - 獨立套件價值 */}
      <StandalonePackages />

      {/* 6. Ecosystem Integrations - 生態系統整合 */}
      <EcosystemIntegrations />

      {/* 7. Comparison - 競品對比 */}
      <Comparison />

      {/* 8. Get Started - 行動號召 */}
      <GetStarted />
    </div>
  );
}
