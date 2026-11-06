{
  outputs = { flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        inherit (pkgs.lib.fileset) toSource unions;
      in
      rec {
        packages.default = pkgs.stdenv.mkDerivation rec {
          pname = "life-gpu";
          version = "1.0.0";

          src = toSource {
            root = ./.;
            fileset = unions [
              ./index.html
              ./life.comp.wgsl
              ./life.rend.wgsl
              ./main.ts
              ./package.json
              ./pnpm-lock.yaml
              ./vite.config.ts
            ];
          };

          nativeBuildInputs = with pkgs; [
            nodejs
            pnpm
            pnpmConfigHook
          ];

          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit pname src version;
            fetcherVersion = 4;
            hash = "sha256-bEhiITFhnsLxXz4nVHxE2FFbBb3kXr53KM46s5P3B8A=";
          };

          buildPhase = "pnpm build";
          installPhase = "cp -r dist $out";
        };

        devShells.default = pkgs.mkShell {
          inputsFrom = [ packages.default ];
        };
      }
    );
}
