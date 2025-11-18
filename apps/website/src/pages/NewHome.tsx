import { Comparison } from '../components/Comparison.tsx';
import { EcosystemIntegrations } from '../components/EcosystemIntegrations.tsx';
import { Features } from '../components/Features.tsx';
import { GetStarted } from '../components/GetStarted.tsx';
import { MigrationPaths } from '../components/MigrationPaths.tsx';
import { NewHero } from '../components/NewHero.tsx';
import { StandalonePackages } from '../components/StandalonePackages.tsx';

export function NewHome() {
  return (
    <div>
      {/* 1. Hero - 立即展示價值主張 */}
      <NewHero />

      {/* 2. Features - 核心優勢 */}
      <Features />

      {/* 3. Migration Paths - 降低遷移障礙 */}
      <MigrationPaths />

      {/* 4. Standalone Packages - 獨立套件價值 */}
      <StandalonePackages />

      {/* 5. Ecosystem Integrations - 生態系統整合 */}
      <EcosystemIntegrations />

      {/* 6. Comparison - 競品對比 */}
      <Comparison />

      {/* 7. Get Started - 行動號召 */}
      <GetStarted />
    </div>
  );
}
