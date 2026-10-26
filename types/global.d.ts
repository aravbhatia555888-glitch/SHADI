/// <reference types="react" />
/// <reference types="react-native" />

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";
declare module "*.svg" {
  import React from "react";
import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare interface RequireContext {
  context: (
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
    mode?: string
  ) => string;
}

declare let require: RequireContext;
