import { Model } from "src/fileCreators/types";
import type { CodeBlockWriter, SourceFile } from "ts-morph";

export function addBigIntListFilter(utilsFile: SourceFile, models: readonly Model[]) {
  const bigIntListFields = models
    .flatMap(({ fields }) => fields)
    .filter((field) => field.type === "BigInt" && field.isList);
  if (bigIntListFields.length === 0) return;

  utilsFile.addFunction({
    name: "whereBigIntListFilter",
    isExported: true,
    typeParameters: [{ name: "T" }, { name: "R", constraint: `Prisma.Result<T, object, "findFirstOrThrow">` }],
    parameters: [
      { name: "record", type: `R` },
      { name: "fieldName", type: "keyof R" },
      { name: "scalarListFilter", type: "undefined | Prisma.BigIntNullableListFilter<unknown>" },
    ],
    returnType: "boolean",
    statements: (writer) => {
      writer
        .writeLine(`if (scalarListFilter === undefined) return true;`)
        .blankLine()
        .writeLine(`const value = record[fieldName] as bigint[] | undefined;`)
        .writeLine(`if (value === undefined && Object.keys(scalarListFilter).length) return false;`);
      addEqualsHandler(writer);
      addHasHandler(writer);
      addHasSomeHandler(writer);
      addHasEveryHandler(writer);
      addIsEmptyHandler(writer);
      writer.writeLine(`return true;`);
    },
  });
}

function addEqualsHandler(writer: CodeBlockWriter) {
  writer.writeLine(`if (Array.isArray(scalarListFilter.equals))`).block(() => {
    writer
      .writeLine(`if (scalarListFilter.equals.length !== value?.length) return false;`)
      .writeLine(`if (!scalarListFilter.equals.every((val, i) => BigInt(val) === value[i])) return false;`);
  });
}

function addHasHandler(writer: CodeBlockWriter) {
  writer
    .writeLine(`if (typeof scalarListFilter.has === 'bigint' || typeof scalarListFilter.has === 'number')`)
    .block(() => {
      writer.writeLine(`if (!value?.includes(BigInt(scalarListFilter.has))) return false;`);
    })
    .writeLine(`if (scalarListFilter.has === null) return false;`);
}

function addHasSomeHandler(writer: CodeBlockWriter) {
  writer.writeLine(`if (Array.isArray(scalarListFilter.hasSome))`).block(() => {
    writer.writeLine(`if (!scalarListFilter.hasSome.some((val) => value?.includes(BigInt(val)))) return false;`);
  });
}

function addHasEveryHandler(writer: CodeBlockWriter) {
  writer.writeLine(`if (Array.isArray(scalarListFilter.hasEvery))`).block(() => {
    writer.writeLine(`if (!scalarListFilter.hasEvery.every((val) => value?.includes(BigInt(val)))) return false;`);
  });
}

function addIsEmptyHandler(writer: CodeBlockWriter) {
  writer
    .writeLine(`if (scalarListFilter.isEmpty === true && value?.length) return false;`)
    .writeLine(`if (scalarListFilter.isEmpty === false && value?.length === 0) return false;`);
}
