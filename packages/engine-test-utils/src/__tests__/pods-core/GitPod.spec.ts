import { tmpDir, vault2Path } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { GitPunchCardExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { testWithEngine } from "../../engine";
import { checkString, GitTestUtils } from "../../utils";

// Skip on Windows for now until reliability issues can be fixed.
//TODO: Re-enable for Windows
const runTest = os.platform() === "win32" ? describe.skip : describe;

runTest("GitPod", () => {
  testWithEngine("basic", async ({ engine, wsRoot, vaults }) => {
    const dest = tmpDir().name;
    await Promise.all(
      vaults.map((vault) => {
        return GitTestUtils.createRepoWithReadme(vault2Path({ vault, wsRoot }));
      })
    );
    await GitTestUtils.createRepoWithReadme(wsRoot);
    const gitPunch = new GitPunchCardExportPod();
    await gitPunch.execute({
      engine,
      wsRoot,
      vaults,
      config: {
        dest,
      },
    });
    expect(
      FileTestUtils.cmpFiles(dest, ["commits.csv", "index.html"])
    ).toBeTruthy();
    const csvOutput = fs.readFileSync(path.join(dest, "commits.csv"), {
      encoding: "utf8",
    });
    await checkString(csvOutput, "0,8,63");
    expect(csvOutput.split("\n").length).toEqual(5);
  });
});
