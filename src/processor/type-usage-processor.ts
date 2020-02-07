import { TypeUsage } from '../scope/type/type-usage';
import { Helper } from './helper';
import { TypeDeclarationProcessor } from './type-declaration-processor';
import { Interval } from '../scope/interval';
import { DocumentInfo } from '../core/document-info';
import { Scope } from '../scope/scope';
import { Type_usageContext, QualifierContext } from '../_generated/AntlrGlslParser';
import { QualifierUsage } from '../scope/qualifier/qualifier-usage';
import { ArrayUsage } from '../scope/array-usage';

export class TypeUsageProcessor {

    private static di: DocumentInfo;
    private static scope: Scope;

    private static tuc: Type_usageContext;

    private static initialize(scope: Scope, di: DocumentInfo): void {
        this.di = di;
        this.scope = scope;
    }

    //
    //function return type
    //
    public static getReturnType(tuc: Type_usageContext, scope: Scope, di: DocumentInfo): TypeUsage {
        this.initialize(scope, di);
        this.tuc = tuc;
        const tu = this.getType(0, new ArrayUsage());
        //TODO: implicit precision qualifier
        return tu;
    }

    //
    //function parameter
    //
    public static getParameterType(tuc: Type_usageContext, variableArray: ArrayUsage, scope: Scope, di: DocumentInfo): TypeUsage {
        this.initialize(scope, di);
        this.tuc = tuc;
        const tu = this.getType(0, variableArray);
        this.addImplicitParameterQualifiers(tu);
        //TODO: implicit precision qualifier
        return tu;
    }

    private static addImplicitParameterQualifiers(tu: TypeUsage): void {
        if (!tu.qualifiers.some(qu => qu.isParameterQualifier())) {
            tu.implicitQualifiers.push(this.di.builtin.qualifiers.get('in'));
        }
    }

    //
    //multiple variable declaration
    //
    public static getMemberType(tuc: Type_usageContext, variableArray: ArrayUsage, scope: Scope, di: DocumentInfo, index: number): TypeUsage {
        this.initialize(scope, di);
        this.tuc = tuc;
        const tu = this.getType(index, variableArray);
        //TODO: implicit precision qualifier
        return tu;
    }

    //
    //general
    //
    private static getType(index: number, variableArray: ArrayUsage): TypeUsage {
        if (this.tuc.type()) {
            return this.getRealType(index, variableArray);
        } else {
            return this.getStructType(index, variableArray);
        }
    }

    private static getRealType(index: number, variableArray: ArrayUsage): TypeUsage {
        const name = this.tuc.type().text;
        const nameInterval = Helper.getIntervalFromParserRule(this.tuc.type());
        const interval = Helper.getIntervalFromParserRule(this.tuc);
        const au = Helper.getArraySizeFromArraySubscript(this.tuc.array_subscript(), this.scope, this.di).mergeArrays(variableArray);
        const td = TypeDeclarationProcessor.searchTypeDeclaration(name, nameInterval, this.scope, this.di);
        const tu = new TypeUsage(name, interval, nameInterval, this.scope, td, au);
        this.addQualifiers(tu);
        if (index === 0) {
            if (!tu.isVoid()) {
                this.scope.typeUsages.push(tu);
            }
            if (td) {
                td.usages.push(tu);
            }
        }
        return tu;
    }

    private static getStructType(index: number, variableArray: ArrayUsage): TypeUsage {
        const tdc = this.tuc.type_declaration();
        const au = Helper.getArraySizeFromArraySubscript(this.tuc.array_subscript(), this.scope, this.di).mergeArrays(variableArray);
        const td = TypeDeclarationProcessor.getTypeDeclaration(tdc, this.scope, this.di, index);
        const tu = new TypeUsage(td.name, td.structInterval, Interval.NONE, this.scope, td, au, true);
        this.addQualifiers(tu);
        return tu;
    }

    private static addQualifiers(tu: TypeUsage): void {
        for (const qc of this.tuc.qualifier()) {
            const qu = this.getQualifierUsage(qc, this.scope);
            if (qu) {
                tu.qualifiers.push(qu);
            }
        }
    }

    private static getQualifierUsage(qc: QualifierContext, scope: Scope): QualifierUsage {
        const name = qc.text;
        const nameInterval = Helper.getIntervalFromParserRule(qc);
        const q = this.di.builtin.qualifiers.get(name);
        const qu = new QualifierUsage(name, nameInterval, scope, q);
        if (q) {
            q.usages.push(qu);
        }
        return qu;
    }

}