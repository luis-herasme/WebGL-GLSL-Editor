import { DocumentSymbolProvider, TextDocument, CancellationToken, ProviderResult, SymbolInformation, DocumentSymbol, SymbolKind, Range } from 'vscode';
import { GlslEditor } from '../core/glsl-editor';
import { Scope } from '../scope/scope';
import { DocumentInfo } from '../core/document-info';
import { FunctionDeclaration } from '../scope/function/function-declaration';
import { TypeDeclaration } from '../scope/type/type-declaration';
import { VariableDeclaration } from '../scope/variable/variable-declaration';
import { Interval } from '../scope/interval';

export class GlslDocumentSymbolProvider implements DocumentSymbolProvider {

    private di: DocumentInfo;
    private result: Array<DocumentSymbol>;

    //TODO:
    //interface blocks

    private initialize(document: TextDocument): void {
        GlslEditor.processDocument(document);
        this.di = GlslEditor.getDocumentInfo(document.uri);
        this.result = new Array<DocumentSymbol>();
    }

    public provideDocumentSymbols(document: TextDocument, token: CancellationToken): ProviderResult<SymbolInformation[] | DocumentSymbol[]> {
        this.initialize(document);
        for (const td of this.di.getRootScope().typeDeclarations) {
            this.addStruct(td, null);
        }
        for (const vd of this.di.getRootScope().variableDeclarations) {
            this.addVariable(vd, null, false);
        }
        for (const fd of this.di.getRootScope().functionDefinitions) {
            this.addFunction(fd);
        }
        return this.result;
    }

    private addFunction(fd: FunctionDeclaration): void {
        const range = this.di.intervalToRange(fd.interval);
        const selectionRange = this.di.intervalToRange(fd.nameInterval);
        const type = fd.returnType.toStringWithoutQualifiers() ?? '<unnamed struct>';
        const ds = new DocumentSymbol(fd.name, type, SymbolKind.Function, range, selectionRange);
        this.addLocalElements(ds, fd, fd.functionScope);
        this.result.push(ds);
    }

    private addStruct(td: TypeDeclaration, parent: DocumentSymbol): void {
        const range = this.di.intervalToRange(td.structInterval);
        const selectionRange = this.getRange(td.nameInterval, td.structInterval);
        const name = td.name ?? '<unnamed struct>';
        const ds = new DocumentSymbol(name, null, SymbolKind.Struct, range, selectionRange);
        for (const vd of td.members) {
            this.addVariable(vd, ds, true);
        }
        if (parent) {
            parent.children.push(ds);
        } else {
            this.result.push(ds);
        }
    }

    private addVariable(vd: VariableDeclaration, parent: DocumentSymbol, property: boolean): void {
        const range = this.di.intervalToRange(vd.declarationInterval);
        const selectionRange = this.getRange(vd.nameInterval, vd.declarationInterval);
        const name = vd.name ?? '<unnamed variable>';
        let info = vd.type.toStringWithoutQualifiers() ?? '<unnamed struct>';
        info = vd.parameter ? info + ' (parameter)' : info;
        const sk = this.getSymbolKind(vd, property);// property ? SymbolKind.Field : SymbolKind.Variable;
        const ds = new DocumentSymbol(name, info, sk, range, selectionRange);
        if (parent) {
            parent.children.push(ds);
        } else {
            this.result.push(ds);
        }
    }

    private getSymbolKind(vd: VariableDeclaration, property: boolean): SymbolKind {
        if (property) {
            return SymbolKind.Property;
        }
        return vd.scope.parent ? SymbolKind.Variable : SymbolKind.Field;
    }

    private addLocalElements(ds: DocumentSymbol, fd: FunctionDeclaration, scope: Scope): void {
        for (const td of scope.typeDeclarations) {
            this.addStruct(td, ds);
        }
        for (const vd of scope.variableDeclarations) {
            this.addVariable(vd, ds, false);
        }
        for (const childScope of scope.children) {
            this.addLocalElements(ds, fd, childScope);
        }
    }

    private getRange(interval: Interval, defaultInterval: Interval): Range {
        const availableInterval = interval !== Interval.NONE ? interval : defaultInterval;
        return this.di.intervalToRange(availableInterval);
    }

}
