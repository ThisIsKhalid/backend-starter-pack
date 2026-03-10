#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const MODULES_DIR = path.join(PROJECT_ROOT, "src", "app", "modules");
const ROUTES_INDEX_FILE = path.join(PROJECT_ROOT, "src", "app", "routes", "index.ts");

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const skipRouteRegistration = args.includes("--no-route");
const forceOverwrite = args.includes("--force");

const nameArg = args.find((arg) => !arg.startsWith("-"));

const printUsage = () => {
  console.log("Usage: npm run module:create -- <ModuleName> [--no-route] [--force]");
  console.log("");
  console.log("Examples:");
  console.log("  npm run module:create -- Book");
  console.log("  npm run module:create -- BlogPost");
  console.log("  npm run module:create -- ProductReview --no-route");
};

if (showHelp || !nameArg) {
  printUsage();
  process.exit(showHelp ? 0 : 1);
}

const splitWords = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);

const toPascalCase = (value) =>
  splitWords(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

const toCamelCase = (value) => {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const toKebabCase = (value) =>
  splitWords(value)
    .map((word) => word.toLowerCase())
    .join("-");

const moduleName = toPascalCase(nameArg);
const moduleFileBase = toCamelCase(nameArg);
const moduleRoutePath = toKebabCase(nameArg);
const moduleVarName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);

if (!moduleName) {
  console.error("❌ Invalid module name.");
  printUsage();
  process.exit(1);
}

const moduleDir = path.join(MODULES_DIR, moduleName);
const filePaths = {
  interface: path.join(moduleDir, `${moduleFileBase}.interface.ts`),
  validation: path.join(moduleDir, `${moduleFileBase}.validation.ts`),
  service: path.join(moduleDir, `${moduleFileBase}.service.ts`),
  controller: path.join(moduleDir, `${moduleFileBase}.controller.ts`),
  route: path.join(moduleDir, `${moduleFileBase}.route.ts`),
};

const interfaceTemplate = `export interface ICreate${moduleName}Input {
  name: string;
}

export interface IUpdate${moduleName}Input extends Partial<ICreate${moduleName}Input> {}
`;

const validationTemplate = `import { z } from "zod";

const create${moduleName}ZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
  }),
});

const update${moduleName}ZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
  }),
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

const ${moduleVarName}IdParamZodSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

export const ${moduleName}Validation = {
  create${moduleName}ZodSchema,
  update${moduleName}ZodSchema,
  ${moduleVarName}IdParamZodSchema,
};
`;

const serviceTemplate = `import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import { ICreate${moduleName}Input, IUpdate${moduleName}Input } from "./${moduleFileBase}.interface";

const create${moduleName} = async (payload: ICreate${moduleName}Input) => {
  void payload;
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "create${moduleName} is not implemented yet.");
};

const getAll${moduleName}s = async (query: Record<string, unknown>) => {
  void query;
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "getAll${moduleName}s is not implemented yet.");
};

const get${moduleName}ById = async (id: string) => {
  void id;
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "get${moduleName}ById is not implemented yet.");
};

const update${moduleName} = async (id: string, payload: IUpdate${moduleName}Input) => {
  void id;
  void payload;
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "update${moduleName} is not implemented yet.");
};

const delete${moduleName} = async (id: string) => {
  void id;
  throw new ApiError(httpStatus.NOT_IMPLEMENTED, "delete${moduleName} is not implemented yet.");
};

export const ${moduleName}Service = {
  create${moduleName},
  getAll${moduleName}s,
  get${moduleName}ById,
  update${moduleName},
  delete${moduleName},
};
`;

const controllerTemplate = `import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ${moduleName}Service } from "./${moduleFileBase}.service";

const create${moduleName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.create${moduleName}(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "${moduleName} created successfully.",
    data: result,
  });
});

const getAll${moduleName}s = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.getAll${moduleName}s(req.query as Record<string, unknown>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "${moduleName} list retrieved successfully.",
    data: result,
  });
});

const get${moduleName}ById = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.get${moduleName}ById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "${moduleName} retrieved successfully.",
    data: result,
  });
});

const update${moduleName} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.update${moduleName}(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "${moduleName} updated successfully.",
    data: result,
  });
});

const delete${moduleName} = catchAsync(async (req: Request, res: Response) => {
  await ${moduleName}Service.delete${moduleName}(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "${moduleName} deleted successfully.",
    data: null,
  });
});

export const ${moduleName}Controller = {
  create${moduleName},
  getAll${moduleName}s,
  get${moduleName}ById,
  update${moduleName},
  delete${moduleName},
};
`;

const routeTemplate = `import express from "express";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { ${moduleName}Controller } from "./${moduleFileBase}.controller";
import { ${moduleName}Validation } from "./${moduleFileBase}.validation";

const router = express.Router();

router.post(
  "/",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(${moduleName}Validation.create${moduleName}ZodSchema),
  ${moduleName}Controller.create${moduleName}
);

router.get("/", auth("USER", "ADMIN", "SUPER_ADMIN"), ${moduleName}Controller.getAll${moduleName}s);

router.get(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(${moduleName}Validation.${moduleVarName}IdParamZodSchema),
  ${moduleName}Controller.get${moduleName}ById
);

router.patch(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(${moduleName}Validation.update${moduleName}ZodSchema),
  ${moduleName}Controller.update${moduleName}
);

router.delete(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  RequestValidation.validateRequest(${moduleName}Validation.${moduleVarName}IdParamZodSchema),
  ${moduleName}Controller.delete${moduleName}
);

export const ${moduleName}Routes = router;
`;

const filesToCreate = [
  { path: filePaths.interface, content: interfaceTemplate },
  { path: filePaths.validation, content: validationTemplate },
  { path: filePaths.service, content: serviceTemplate },
  { path: filePaths.controller, content: controllerTemplate },
  { path: filePaths.route, content: routeTemplate },
];

if (!fs.existsSync(MODULES_DIR)) {
  console.error(`❌ Modules directory not found: ${MODULES_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(moduleDir)) {
  fs.mkdirSync(moduleDir, { recursive: true });
}

const existingFiles = filesToCreate
  .filter((file) => fs.existsSync(file.path))
  .map((file) => file.path);

if (existingFiles.length > 0 && !forceOverwrite) {
  console.error("❌ Module files already exist. Use --force to overwrite.");
  existingFiles.forEach((file) => console.error(`   - ${path.relative(PROJECT_ROOT, file)}`));
  process.exit(1);
}

for (const file of filesToCreate) {
  fs.writeFileSync(file.path, file.content, "utf8");
}

const registerRoute = () => {
  if (skipRouteRegistration) {
    console.log("ℹ️  Skipped route registration (--no-route).");
    return;
  }

  if (!fs.existsSync(ROUTES_INDEX_FILE)) {
    console.warn(`⚠️  Route index file not found: ${ROUTES_INDEX_FILE}`);
    return;
  }

  const importLine = `import { ${moduleName}Routes } from "../modules/${moduleName}/${moduleFileBase}.route";`;
  const routeLine = `  {\n    path: "/${moduleRoutePath}",\n    route: ${moduleName}Routes,\n  },\n`;

  let routeContent = fs.readFileSync(ROUTES_INDEX_FILE, "utf8");

  if (!routeContent.includes(importLine)) {
    const importMatches = [...routeContent.matchAll(/^import .*;$/gm)];
    if (importMatches.length === 0) {
      console.warn("⚠️  Could not locate import section in routes index file.");
      return;
    }

    const lastImport = importMatches[importMatches.length - 1];
    const insertPosition = lastImport.index + lastImport[0].length;
    routeContent = `${routeContent.slice(0, insertPosition)}\n${importLine}${routeContent.slice(insertPosition)}`;
  }

  if (!routeContent.includes(`route: ${moduleName}Routes`)) {
    const moduleRoutesRegex = /const moduleRoutes = \[\n([\s\S]*?)\n\];/m;
    const moduleRoutesMatch = routeContent.match(moduleRoutesRegex);

    if (!moduleRoutesMatch) {
      console.warn("⚠️  Could not locate moduleRoutes array in routes index file.");
      fs.writeFileSync(ROUTES_INDEX_FILE, routeContent, "utf8");
      return;
    }

    const currentBlock = moduleRoutesMatch[1];
    let updatedBlock;

    if (currentBlock.includes("  //   {")) {
      updatedBlock = currentBlock.replace("  //   {", `${routeLine}  //   {`);
    } else {
      const suffix = currentBlock.trim().length > 0 ? "\n" : "";
      updatedBlock = `${currentBlock}${suffix}${routeLine.trimEnd()}`;
    }

    routeContent = routeContent.replace(
      moduleRoutesRegex,
      `const moduleRoutes = [\n${updatedBlock}\n];`
    );
  }

  fs.writeFileSync(ROUTES_INDEX_FILE, routeContent, "utf8");
  console.log(`✅ Registered route: /${moduleRoutePath}`);
};

registerRoute();

console.log(`✅ Module '${moduleName}' created successfully.`);
console.log("Generated files:");
Object.values(filePaths).forEach((file) => {
  console.log(`  - ${path.relative(PROJECT_ROOT, file)}`);
});
