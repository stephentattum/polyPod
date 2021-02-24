const shell = require("shelljs");
const desiredRevision = "5374149f";

if (!shell.which("git")) {
    shell.echo("Sorry, this script requires git");
    shell.exit(1);
}

shell.exec("git clone git@github.com:polypoly-eu/polypedia-data");
shell.cd("polypedia-data");
shell.exec("git reset --hard " + desiredRevision);
shell.cp("./data/3_integrated/polyExplorer/*.json", "../dist/data");
