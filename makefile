ROOT=$(shell pwd)
FLAGS=	--manage_closure_dependencies=true \
				--externs=cb/extern/compatibility.js \
				--externs=resources/extern/jquery-1.8-extern.js \
				--externs=cb/extern/jquery-extensions-extern.js \
				--externs=resources/extern/webkit_console-extern.js \
				--externs=cb/extern/timezoneJS-extern.js \
				--js=resources/closure/closure/goog/deps.js \
				--js=deps.js \
				--js=config.js \
				--js=cb/req.js \
				--js=cb/util/util.js \
				--js=cb/util/types.js \
				--js=cb/util/interval.js \
				--js=cb/util/server.js \
				--js=cb/moduler.js \
				--js=cb/modules/calmodules.js \
				--js=cb/modules/nav.js \
				--js=cb/modules/viewNav.js \
				--js=cb/modules/button.js \
				--js=cb/modules/leftNav.js \
				--js=cb/modules/reports.js \
				--js=cb/modules/footerMenu.js \
				--js=cb/modules/hourBoxes.js \
				--js=cb/modules/headerBar.js \
				--js=cb/modules/colLayer.js \
				--js=cb/modules/column.js \
				--js=cb/modules/columns.js \
				--js=cb/modules/dayView.js \
				--js=cb/modules/weekView.js \
				--js=cb/modules/dayBox.js \
				--js=cb/modules/monthView.js \
				--js=cb/modules/event.js \
				--js=cb/modules/eventLayer.js \
				--js=cb/modules/timeColumn.js \
				--js=cb/modules/sephora/sephora.js \
				--js=cb/modules/sephora/eventTable.js \
				--js=cb/modules/sephora/widget.js \
				--js=cb/modules/service.js \
				--js=cb/boot.js \
				--js_output_file=main.min.js \
				--warning_level=VERBOSE \
				--jscomp_error=checkTypes \
				--jscomp_error=const \
				--jscomp_error=constantProperty \
				--jscomp_error=duplicate \
				--jscomp_error=es5Strict \
				--jscomp_error=missingProperties \
				--jscomp_error=ambiguousFunctionDecl \
				--jscomp_error=accessControls \
				--jscomp_error=checkRegExp \
				--jscomp_error=externsValidation \
				--jscomp_error=globalThis \
				--jscomp_error=internetExplorerChecks \
				--jscomp_error=undefinedNames \
				--jscomp_error=undefinedVars \
				--jscomp_error=strictModuleDepCheck \
				--jscomp_error=visibility \
				--jscomp_error=invalidCasts
FLAGS2=	--js=cb/modules/calmodules.js \
				--js=cb/modules/bookingMenuList.js \
				--js=cb/modules/bookingMenuListItem.js \
				--js=cb/modules/bookingMenu.js \
				--js=cb/modules/service.js \

main: deps compile
compile: 
	@java -jar ./resources/closure/compiler.jar \
		$(FLAGS)
whitespace:
	java -jar ./resources/closure/compiler.jar \
		--compilation_level=WHITESPACE \
		$(FLAGS)
simple:
	java -jar ./resources/closure/compiler.jar \
		--compilation_level=SIMPLE_OPTIMIZATIONS \
		$(FLAGS)
deps:
	@python resources/closure/closure/bin/calcdeps.py \
		--path resources/closure \
		--input cb/req.js \
		--output_mode=script \
		> deps.js
list:
	python resources/closure/closure/bin/calcdeps.py \
		--path resources/closure \
		--input cb/req.js \
		--output_mode list
advanced:
	java -jar ./resources/closure/compiler.jar \
		--compilation_level=ADVANCED_OPTIMIZATIONS \
		$(FLAGS)
