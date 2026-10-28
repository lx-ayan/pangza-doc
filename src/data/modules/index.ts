import type { Locale } from "../../i18n/types";
import type { DocPage, DocSection } from "../../types/doc";
import type { CoreModule } from "../nav";

import {
  applicationApi as applicationApiZh,
  applicationConfig as applicationConfigZh,
} from "./application";
import { authApi as authApiZh, authConfig as authConfigZh } from "./auth";
import { ormApi as ormApiZh, ormConfig as ormConfigZh } from "./orm";
import { redisApi as redisApiZh, redisConfig as redisConfigZh } from "./redis";
import {
  serviceApi as serviceApiZh,
  serviceConfig as serviceConfigZh,
} from "./service";
import {
  configApi as configApiZh,
  configConfig as configConfigZh,
  encryptApi as encryptApiZh,
  encryptConfig as encryptConfigZh,
  exceptionApi as exceptionApiZh,
  exceptionConfig as exceptionConfigZh,
  jsonApi as jsonApiZh,
  jsonConfig as jsonConfigZh,
  langchainApi as langchainApiZh,
  langchainConfig as langchainConfigZh,
  logApi as logApiZh,
  logConfig as logConfigZh,
  loggerApi as loggerApiZh,
  loggerConfig as loggerConfigZh,
  scheduleApi as scheduleApiZh,
  scheduleConfig as scheduleConfigZh,
  typesApi as typesApiZh,
  typesConfig as typesConfigZh,
  utilsApi as utilsApiZh,
  utilsConfig as utilsConfigZh,
  validateApi as validateApiZh,
  validateConfig as validateConfigZh,
} from "./rest";

import {
  applicationApi as applicationApiEn,
  applicationConfig as applicationConfigEn,
} from "./en/application";
import { authApi as authApiEn, authConfig as authConfigEn } from "./en/auth";
import { ormApi as ormApiEn, ormConfig as ormConfigEn } from "./en/orm";
import { redisApi as redisApiEn, redisConfig as redisConfigEn } from "./en/redis";
import {
  serviceApi as serviceApiEn,
  serviceConfig as serviceConfigEn,
} from "./en/service";
import {
  configApi as configApiEn,
  configConfig as configConfigEn,
  encryptApi as encryptApiEn,
  encryptConfig as encryptConfigEn,
  exceptionApi as exceptionApiEn,
  exceptionConfig as exceptionConfigEn,
  jsonApi as jsonApiEn,
  jsonConfig as jsonConfigEn,
  langchainApi as langchainApiEn,
  langchainConfig as langchainConfigEn,
  logApi as logApiEn,
  logConfig as logConfigEn,
  loggerApi as loggerApiEn,
  loggerConfig as loggerConfigEn,
  scheduleApi as scheduleApiEn,
  scheduleConfig as scheduleConfigEn,
  typesApi as typesApiEn,
  typesConfig as typesConfigEn,
  utilsApi as utilsApiEn,
  utilsConfig as utilsConfigEn,
  validateApi as validateApiEn,
  validateConfig as validateConfigEn,
} from "./en/rest";

function buildMaps(locale: Locale): {
  apiMap: Record<CoreModule, DocPage>;
  configMap: Record<CoreModule, DocPage>;
} {
  if (locale === "en") {
    return {
      apiMap: {
        Application: applicationApiEn,
        Auth: authApiEn,
        config: configApiEn,
        encrypt: encryptApiEn,
        Exception: exceptionApiEn,
        Json: jsonApiEn,
        langchain: langchainApiEn,
        Log: logApiEn,
        Logger: loggerApiEn,
        ORM: ormApiEn,
        Redis: redisApiEn,
        schedule: scheduleApiEn,
        Service: serviceApiEn,
        types: typesApiEn,
        utils: utilsApiEn,
        Validate: validateApiEn,
      },
      configMap: {
        Application: applicationConfigEn,
        Auth: authConfigEn,
        config: configConfigEn,
        encrypt: encryptConfigEn,
        Exception: exceptionConfigEn,
        Json: jsonConfigEn,
        langchain: langchainConfigEn,
        Log: logConfigEn,
        Logger: loggerConfigEn,
        ORM: ormConfigEn,
        Redis: redisConfigEn,
        schedule: scheduleConfigEn,
        Service: serviceConfigEn,
        types: typesConfigEn,
        utils: utilsConfigEn,
        Validate: validateConfigEn,
      },
    };
  }

  return {
    apiMap: {
      Application: applicationApiZh,
      Auth: authApiZh,
      config: configApiZh,
      encrypt: encryptApiZh,
      Exception: exceptionApiZh,
      Json: jsonApiZh,
      langchain: langchainApiZh,
      Log: logApiZh,
      Logger: loggerApiZh,
      ORM: ormApiZh,
      Redis: redisApiZh,
      schedule: scheduleApiZh,
      Service: serviceApiZh,
      types: typesApiZh,
      utils: utilsApiZh,
      Validate: validateApiZh,
    },
    configMap: {
      Application: applicationConfigZh,
      Auth: authConfigZh,
      config: configConfigZh,
      encrypt: encryptConfigZh,
      Exception: exceptionConfigZh,
      Json: jsonConfigZh,
      langchain: langchainConfigZh,
      Log: logConfigZh,
      Logger: loggerConfigZh,
      ORM: ormConfigZh,
      Redis: redisConfigZh,
      schedule: scheduleConfigZh,
      Service: serviceConfigZh,
      types: typesConfigZh,
      utils: utilsConfigZh,
      Validate: validateConfigZh,
    },
  };
}

function prefixSectionIds(sections: DocSection[], prefix: string): DocSection[] {
  return sections.map((s) => ({
    ...s,
    id: `${prefix}-${s.id}`,
    title: s.title,
  }));
}

const OVERVIEW_TITLES = new Set(["模块说明", "Overview", "Module overview"]);

/** 合并 API + 配置项为一篇文档（侧栏只显示模块名） */
export function getModulePage(
  mod: string,
  locale: Locale = "zh"
): DocPage | undefined {
  const { apiMap, configMap } = buildMaps(locale);
  const api = apiMap[mod as CoreModule];
  const cfg = configMap[mod as CoreModule];
  if (!api && !cfg) return undefined;

  const configTitle = locale === "en" ? "Configuration" : "配置项";

  const sections: DocSection[] = [];
  if (api) {
    sections.push({
      id: "api",
      title: "API",
      content: api.description,
    });
    const apiSections = api.sections.filter(
      (s) => s.id !== "overview" && !OVERVIEW_TITLES.has(s.title)
    );
    sections.push(...prefixSectionIds(apiSections, "api"));
  }
  if (cfg) {
    sections.push({
      id: "config",
      title: configTitle,
      content: cfg.description,
    });
    sections.push(...prefixSectionIds(cfg.sections, "config"));
  }

  return {
    key: mod,
    title: mod,
    description: api?.description ?? cfg?.description,
    sections,
  };
}
