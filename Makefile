# Forwards every harness-* target to the harness submodule's Makefile, so the
# documented `make -f .harness/Makefile <target>` also works as plain
# `make <target>` from the project root. The harness prefixes all of its targets
# with `harness-`, so this pattern rule can never shadow a project target.
.PHONY: harness-%
harness-%:
	@$(MAKE) -f .harness/Makefile harness-$*
