import { Comparison } from '../components/Comparison.tsx';
import { CrossPlatform } from '../components/CrossPlatform.tsx';
import { EcosystemIntegrations } from '../components/EcosystemIntegrations.tsx';
import { Features } from '../components/Features.tsx';
import { GetStarted } from '../components/GetStarted.tsx';
import { InteractiveDemo } from '../components/InteractiveDemo.tsx';
import { MigrationPaths } from '../components/MigrationPaths.tsx';
import { NewHero } from '../components/NewHero.tsx';
import { PerformanceDemo } from '../components/PerformanceDemo.tsx';
import { StandalonePackages } from '../components/StandalonePackages.tsx';
import { TUIShowcase } from '../components/TUIShowcase.tsx';

export function NewHome() {
  return (
    <div>
      {/* 1. Hero - 立即展示價值主張 */}
      <NewHero />

      {/* 2. Cross-Platform - 展示 web + TUI 統一架構 */}
      <CrossPlatform />

      {/* 3. Interactive Demo - 體驗響應式 (包含 Switch/Context demo) */}
      <InteractiveDemo />

      {/* 4. TUI Showcase - 終端 UI 展示 */}
      <TUIShowcase />

      {/* 5. Features - 核心優勢 */}
      <Features />

      {/* 6. Performance Demo - 展示效能 */}
      <PerformanceDemo />

      {/* 7. Migration Paths - 降低遷移障礙 */}
      <MigrationPaths />

      {/* 8. Standalone Packages - 獨立套件價值 */}
      <StandalonePackages />

      {/* 9. Ecosystem Integrations - 生態系統整合 */}
      <EcosystemIntegrations />

      {/* 10. Comparison - 競品對比 */}
      <Comparison />

      {/* 11. Get Started - 行動號召 */}
      <GetStarted />
    </div>
  );
}
