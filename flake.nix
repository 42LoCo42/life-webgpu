{
  outputs = { flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        mkSrc = x: pkgs.lib.fileset.toSource { root = x; fileset = x; };
      in
      rec {
        packages = rec {
          web = pkgs.stdenv.mkDerivation (drv: {
            pname = "lifegpu-web";
            version = "1.0.0";
            src = mkSrc ./web;

            __structuredAttrs = true;
            strictDeps = true;

            nativeBuildInputs = with pkgs; [
              nodejs
              pnpm
              pnpmConfigHook
            ];

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (drv) pname src version;
              fetcherVersion = 4;
              hash = "sha256-bEhiITFhnsLxXz4nVHxE2FFbBb3kXr53KM46s5P3B8A=";
            };

            buildPhase = "pnpm build";
            installPhase = "cp -r dist $out";
          });

          default = pkgs.linkFarmFromDrvs "lifegpu" [ web ];
        };

        devShells.default = pkgs.mkShell {
          inputsFrom = [ packages.default ];
        };
      }
    );
}
