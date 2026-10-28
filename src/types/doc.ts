export interface ApiParam {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface ApiItem {
  name: string;
  signature?: string;
  description: string;
  params?: ApiParam[];
  returns?: string;
}

export interface ConfigItem {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface DocSection {
  id: string;
  title: string;
  content?: string;
  apis?: ApiItem[];
  configs?: ConfigItem[];
  /** 装饰器代码示例；标题默认「装饰器用法」 */
  decoratorExample?: string;
  decoratorExampleTitle?: string;
  /** 函数式 / YAML 等示例；标题默认「函数式用法」，配置段请改成「配置示例」 */
  functionalExample?: string;
  functionalExampleTitle?: string;
}

export interface DocPage {
  key: string;
  title: string;
  description?: string;
  sections: DocSection[];
}

export interface NavChild {
  key: string;
  label: string;
  path: string;
}

export interface NavGroup {
  key: string;
  label: string;
  children: NavChild[];
}
