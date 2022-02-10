import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^@src/(.*)": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.(ts|tsx)"],
};

export default config;
