import * as ts from 'typescript';
import * as Lint from 'tslint';
import {RuleFailure} from "tslint";

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "require-connect-typing",
        description: "Require React-Redux connect functions be explicitly typed",
        rationale: "WHen passed mapStateToProps only takes state, the connect function is incorreclty typed",
        optionsDescription: Lint.Utils.dedent``,
        options: {
            type: "array",
            items: {},
            minLength: 0,
            maxLength: 0,
        },
        hasFix: false,
        optionExamples: ["true"],
        type: "typescript",
        typescriptOnly: true,
    };

    apply(sourceFile: ts.SourceFile): RuleFailure[] {
        return this.applyWithWalker(new RequireConnectTyping(sourceFile, this.getOptions()));
    }
}

class RequireConnectTyping extends Lint.RuleWalker {
    private connectName: string | null = null;

    public visitNamedImports(node: ts.NamedImports) {
        /* We need to find out what connect has been imported as.
           We assume that it will always be imported from react-redux
         */

        // Find the module name
        let moduleName: string | null = null;
        if (node.parent && node.parent.kind === ts.SyntaxKind.ImportClause) {
            const parent = node.parent as ts.ImportClause;
            if (parent.parent && parent.parent.kind === ts.SyntaxKind.ImportDeclaration) {
                const grandparent = parent.parent as ts.ImportDeclaration;

                moduleName = grandparent.moduleSpecifier.getText();
            }
        }

        if (moduleName === `'react-redux'`) {

            for (const element of node.elements) {
                const name = element.name.getText();
                const propertyName = ( element.propertyName ? element.propertyName.getText() : null);

                // If property name is set, that is export name so we need to check if either property name or name
                // are equal to connect.
                if (name === 'connect' && propertyName === null) {
                    this.connectName = 'connect';
                } else if (propertyName === 'connect') {
                    // If it is propertyName that is equal to connect then we set connectName to name
                    this.connectName = name;
                }
            }
        }

        super.visitNamedImports(node);
    }

    public visitCallExpression(node: ts.CallExpression) {
        if (node.expression.getText() === this.connectName) {


            if (!node.typeArguments) {
                this.addFailureAt(node.getStart(), node.getWidth(), "React Redux connect function must be typed.");


            }
        }

        super.visitCallExpression(node);
    }
}
