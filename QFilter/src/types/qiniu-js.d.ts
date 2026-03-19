declare module "qiniu-js" {
  // 这里给一个最小类型声明，避免项目没有自带类型时的 TS 报错。
  // 实际上传逻辑在运行时由 qiniu-js 提供。
  export function upload(...args: any[]): any;
}

