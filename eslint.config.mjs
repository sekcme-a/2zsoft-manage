import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // 1. 전역 무시 설정
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  // 2. 커스텀 규칙 설정 추가
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
