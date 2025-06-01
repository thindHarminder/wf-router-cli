#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from "execa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();

const LATEST_WEBFLOW_ROUTER_VERSION = "0.1.4";

// --- INIT COMMAND ---
async function initProject(projectNameArg, options) {
  let projectName = projectNameArg;
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Enter the name for your new project:",
        validate: (input) =>
          /^([A-Za-z\-\_\d])+$/.test(input) ? true : "Invalid project name.",
        default: "my-webflow-app",
      },
    ]);
    projectName = answers.projectName;
  }

  const { packageManager } = await inquirer.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager to use?",
      choices: ["npm", "pnpm", "yarn"], // Added yarn
      default: options.packageManager || "npm",
    },
  ]);

  const projectPath = path.resolve(process.cwd(), projectName);
  const templatePath = path.resolve(__dirname, "../templates/vite-ts"); // Adjust if template path changes

  console.log(
    chalk.cyan(
      `\nInitializing Webflow Router project: ${chalk.bold(projectName)}`
    )
  );

  if (await fs.pathExists(projectPath)) {
    if (options.force) {
      console.log(
        chalk.yellow(
          `Force option enabled. Removing existing directory: ${projectPath}`
        )
      );
      await fs.remove(projectPath);
    } else {
      const { overwrite } = await inquirer.prompt([
        {
          /* ... overwrite prompt ... */ type: "confirm",
          name: "overwrite",
          message: chalk.yellow(
            `Directory ${projectName} already exists. Overwrite?`
          ),
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log(chalk.red("Aborted."));
        process.exit(1);
      }
      await fs.remove(projectPath);
    }
  }

  console.log(chalk.blue(`Scaffolding project in ${projectPath}...`));
  try {
    await fs.copy(templatePath, projectPath, {
      filter: (src) => !src.endsWith("package.json.template"),
    });

    const packageJsonTemplate = await fs.readFile(
      path.join(templatePath, "package.json.template"),
      "utf-8"
    );
    let packageJsonContent = packageJsonTemplate
      .replace("{{PROJECT_NAME}}", projectName)
      .replace('"VERSION_PLACEHOLDER"', `"^${LATEST_WEBFLOW_ROUTER_VERSION}"`);
    await fs.writeFile(
      path.join(projectPath, "package.json"),
      packageJsonContent
    );

    // Handle .gitignore
    const gitignoreTemplatePath = path.join(projectPath, "_gitignore"); // Assuming template has _gitignore
    if (await fs.pathExists(gitignoreTemplatePath)) {
      await fs.rename(
        gitignoreTemplatePath,
        path.join(projectPath, ".gitignore")
      );
    }

    console.log(chalk.green("Project scaffolded."));
    console.log(
      chalk.blue(
        `Installing dependencies with ${chalk.bold(packageManager)}...`
      )
    );

    const installCommand = packageManager === "yarn" ? "add" : "install";
    await execa(packageManager, [installCommand], {
      cwd: projectPath,
      stdio: "inherit",
    });

    console.log(chalk.green("Dependencies installed."));
    console.log(chalk.blue("Generating initial routes..."));

    const generateRouteArgs = [
      "generate-webflow-routes",
      "--pages-dir=src/app-pages",
      "--output-dir=src",
      "--output-file=generated-wf-routes.ts",
    ];
    if (packageManager === "npm") {
      await execa("npx", generateRouteArgs, {
        cwd: projectPath,
        stdio: "inherit",
      });
    } else {
      // pnpm exec or yarn dlx (or just run if it's a dep)
      await execa(packageManager, ["exec", ...generateRouteArgs], {
        cwd: projectPath,
        stdio: "inherit",
      });
    }
    console.log(chalk.green("Initial routes generated."));

    console.log(chalk.cyan("\n🚀 Project ready!"));
    console.log(chalk.green(`  cd ${projectName}`));
    console.log(chalk.green(`  ${packageManager} run dev`));
  } catch (error) {
    /* ... error handling ... */
    console.error(chalk.red("\nAn error occurred during init:"), error);
    if (await fs.pathExists(projectPath)) await fs.remove(projectPath);
    process.exit(1);
  }
}

// --- GENERATE-ROUTES COMMAND (using the existing script) ---
async function generateRoutesCommand(options) {
  const pagesDir = options.pagesDir || "src/app-pages"; // Default or from option
  const outputDir = options.outputDir || "src";
  const outputFile = options.outputFile || "generated-wf-routes.ts";
  const projectRoot = process.cwd(); // Assume command is run from project root

  console.log(chalk.blue(`Generating routes...`));
  console.log(
    chalk.gray(`  Pages directory: ${path.resolve(projectRoot, pagesDir)}`)
  );
  console.log(
    chalk.gray(`  Output: ${path.resolve(projectRoot, outputDir, outputFile)}`)
  );

  try {
    // We need to execute the generate-webflow-routes.mjs script.
    // This script is part of the webflow-router package, which should be a dependency
    // of the user's project.
    // The user's package.json should have a script like:
    // "generate-routes": "generate-webflow-routes --pages-dir=src/app-pages ..."
    // So, the CLI can just inform the user or try to run that script if it exists.
    // For now, let's assume the binary `generate-webflow-routes` is available via npx/pnpm exec
    // if `webflow-router` is installed.

    // This command should ideally be run from within a project that has webflow-router installed.
    // The `generate-webflow-routes` binary comes from the `webflow-router` package.
    await execa(
      "npx",
      [
        // Or use pnpm/yarn exec based on lockfiles if detected
        "generate-webflow-routes",
        `--pages-dir=${pagesDir}`,
        `--output-dir=${outputDir}`,
        `--output-file=${outputFile}`,
      ],
      { cwd: projectRoot, stdio: "inherit" }
    );
    console.log(chalk.green("Routes generated successfully."));
  } catch (error) {
    console.error(
      chalk.red("Failed to generate routes:"),
      error.shortMessage || error
    );
    console.log(
      chalk.yellow(
        "Ensure `webflow-router` is installed in your project and `generate-webflow-routes` is accessible."
      )
    );
    console.log(
      chalk.yellow(
        "You might need to run `npm install webflow-router` or `pnpm add webflow-router`."
      )
    );
  }
}

// --- ADD PAGE COMMAND ---
async function addPageCommand(routePath, options) {
  const projectRoot = process.cwd();
  // TODO: Detect pagesDir from a potential wfrouter.config.json or use default
  const pagesDir = path.resolve(
    projectRoot,
    options.pagesDir || "src/app-pages"
  );
  let targetDir = pagesDir;

  // Normalize routePath: remove leading/trailing slashes for directory creation
  const normalizedPath = routePath.replace(/^\/+|\/+$/g, "");
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length > 0) {
    targetDir = path.join(pagesDir, ...segments);
  }

  const pageFilePath = path.join(targetDir, "+page.ts");
  const layoutFilePath = path.join(targetDir, "+layout.ts");

  console.log(
    chalk.blue(`Adding page component for route: ${chalk.bold(routePath)}`)
  );
  console.log(chalk.gray(`  Target file: ${pageFilePath}`));

  try {
    if ((await fs.pathExists(pageFilePath)) && !options.force) {
      console.warn(
        chalk.yellow(
          `Page file ${pageFilePath} already exists. Use --force to overwrite.`
        )
      );
      return;
    }
    await fs.ensureDir(targetDir);

    const pageContent =
      `import { onMount, onDestroy } from 'webflow-router';\n\n` +
      `onMount(() => {\n` +
      `  console.log('Page mounted: ${normalizedPath || "/"}');\n` +
      `  // Your mount logic here\n` +
      `  return () => {\n` +
      `    console.log('Page unmounted (cleanup): ${
        normalizedPath || "/"
      }');\n` +
      `    // Your onMount cleanup logic here\n` +
      `  };\n` +
      `});\n\n` +
      `onDestroy(() => {\n` +
      `  console.log('Page onDestroy: ${normalizedPath || "/"}');\n` +
      `  // Your destroy logic here\n` +
      `});\n`;
    await fs.writeFile(pageFilePath, pageContent);
    console.log(chalk.green(`Created ${pageFilePath}`));

    if (options.layout) {
      if ((await fs.pathExists(layoutFilePath)) && !options.force) {
        console.warn(
          chalk.yellow(
            `Layout file ${layoutFilePath} already exists. Use --force to overwrite.`
          )
        );
      } else {
        const layoutContent =
          `import { onMount, onDestroy } from 'webflow-router';\n\n` +
          `onMount(() => {\n` +
          `  console.log('Layout mounted for: ${normalizedPath || "/"}');\n` +
          `  return () => {\n` +
          `    console.log('Layout unmounted (cleanup) for: ${
            normalizedPath || "/"
          }');\n` +
          `  };\n` +
          `});\n\n` +
          `onDestroy(() => {\n` +
          `  console.log('Layout onDestroy for: ${normalizedPath || "/"}');\n` +
          `});\n`;
        await fs.writeFile(layoutFilePath, layoutContent);
        console.log(chalk.green(`Created ${layoutFilePath}`));
      }
    }
    console.log(
      chalk.cyan(
        `\nRemember to run 'npm run generate-routes' (or equivalent) to update your route definitions.`
      )
    );
  } catch (error) {
    console.error(chalk.red(`Failed to add page component:`), error);
  }
}

program
  .name("wfrouter")
  .description("CLI for Webflow Router Kit projects")
  .version("0.1.0"); // Version of the CLI tool itself

program
  .command("init [projectName]")
  .description("Initialize a new Webflow Router project")
  .option("-f, --force", "Overwrite existing directory if it exists")
  .option(
    "-p, --package-manager <manager>",
    "Specify package manager (npm, pnpm, yarn)",
    "npm"
  )
  .action(initProject);

program
  .command("generate-routes")
  .description("Generate route definitions from the pages directory")
  .option(
    "--pages-dir <dir>",
    "Directory containing page modules (e.g., src/app-pages)"
  )
  .option(
    "--output-dir <dir>",
    "Directory to output the generated routes file (e.g., src)"
  )
  .option(
    "--output-file <name>",
    "Name of the generated routes file (e.g., generated-wf-routes.ts)"
  )
  .action(generateRoutesCommand);

program
  .command("add <type> <routePath>") // type can be 'page' or 'layout'
  .description(
    "Add a new page or layout component. Example: wfrouter add page /about/us"
  )
  .option("-l, --layout", "Also create a +layout.ts file for the page route")
  .option(
    "--pages-dir <dir>",
    "Base directory for pages (default: src/app-pages)",
    "src/app-pages"
  )
  .option("-f, --force", "Overwrite existing files")
  .action((type, routePath, options) => {
    if (type.toLowerCase() === "page") {
      addPageCommand(routePath, options);
    } else if (type.toLowerCase() === "layout") {
      // TODO: Implement addLayoutCommand similar to addPageCommand
      console.log(
        chalk.yellow(
          `add layout command for "${routePath}" (options: ${JSON.stringify(
            options
          )}) - Not yet implemented.`
        )
      );
      const projectRoot = process.cwd();
      const pagesDir = path.resolve(
        projectRoot,
        options.pagesDir || "src/app-pages"
      );
      let targetDir = pagesDir;
      const normalizedPath = routePath.replace(/^\/+|\/+$/g, "");
      const segments = normalizedPath.split("/").filter(Boolean);
      if (segments.length > 0) targetDir = path.join(pagesDir, ...segments);
      const layoutFilePath = path.join(targetDir, "+layout.ts");
      console.log(chalk.blue(`Would create layout at: ${layoutFilePath}`));
      // Actual file creation logic for layout would go here
    } else {
      console.error(
        chalk.red(`Invalid type "${type}". Must be 'page' or 'layout'.`)
      );
    }
  });

program.parse(process.argv);
