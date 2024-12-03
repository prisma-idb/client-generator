import type { Field, Model } from "src/fileCreators/types";
import { toCamelCase } from "../../../../../helpers/utils";
import { ClassDeclaration, CodeBlockWriter, Scope } from "ts-morph";

export function addApplyWhereClause(modelClass: ClassDeclaration, model: Model, models: readonly Model[]) {
  modelClass.addMethod({
    name: "_applyWhereClause",
    scope: Scope.Private,
    isAsync: true,
    typeParameters: [
      { name: "W", constraint: `Prisma.Args<Prisma.${model.name}Delegate, 'findFirstOrThrow'>['where']` },
      { name: "R", constraint: `Prisma.Result<Prisma.${model.name}Delegate, object, 'findFirstOrThrow'>` },
    ],
    parameters: [
      { name: "records", type: `R[]` },
      { name: "whereClause", type: "W" },
      { name: "tx", type: "IDBUtils.ReadonlyTransactionType | IDBUtils.ReadwriteTransactionType" },
    ],
    returnType: `Promise<R[]>`,
    statements: (writer) => {
      writer.writeLine(`if (!whereClause) return records;`);
      writer
        .writeLine(`return (await Promise.all(records.map(async (record) =>`)
        .block(() => {
          addStringFiltering(writer, model);
          addNumberFiltering(writer, model);
          addBigIntFiltering(writer, model);
          addBoolFiltering(writer, model);
          addBytesFiltering(writer, model);
          addDateTimeFiltering(writer, model);
          // TODO: Decimal and JSON
          addRelationFiltering(writer, model, models);
          writer.writeLine(`return record;`);
        })
        .writeLine(`))).filter((result) => result !== null);;`);
    },
  });
}

function addStringFiltering(writer: CodeBlockWriter, model: Model) {
  const stringFields = model.fields.filter((field) => field.type === "String" && !field.isList).map(({ name }) => name);
  if (stringFields.length === 0) return;
  writer
    .writeLine(`const stringFields = ${JSON.stringify(stringFields)} as const;`)
    .writeLine(`for (const field of stringFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereStringFilter(record, field, whereClause[field])) return null;`);
    });
}

function addNumberFiltering(writer: CodeBlockWriter, model: Model) {
  const numberFields = model.fields
    .filter((field) => (field.type === "Int" || field.type === "Float") && !field.isList)
    .map(({ name }) => name);

  if (numberFields.length === 0) return;
  writer
    .writeLine(`const numberFields = ${JSON.stringify(numberFields)} as const;`)
    .writeLine(`for (const field of numberFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereNumberFilter(record, field, whereClause[field])) return null;`);
    });
}

function addBigIntFiltering(writer: CodeBlockWriter, model: Model) {
  const numberFields = model.fields.filter((field) => field.type === "BigInt" && !field.isList).map(({ name }) => name);

  if (numberFields.length === 0) return;
  writer
    .writeLine(`const bigIntFields = ${JSON.stringify(numberFields)} as const;`)
    .writeLine(`for (const field of bigIntFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereBigIntFilter(record, field, whereClause[field])) return null;`);
    });
}

function addBoolFiltering(writer: CodeBlockWriter, model: Model) {
  const booleanFields = model.fields
    .filter((field) => field.type === "Boolean" && !field.isList)
    .map(({ name }) => name);

  if (booleanFields.length === 0) return;
  writer
    .writeLine(`const booleanFields = ${JSON.stringify(booleanFields)} as const;`)
    .writeLine(`for (const field of booleanFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereBoolFilter(record, field, whereClause[field])) return null;`);
    });
}

function addBytesFiltering(writer: CodeBlockWriter, model: Model) {
  const bytesFields = model.fields.filter((field) => field.type === "Bytes" && !field.isList).map(({ name }) => name);

  if (bytesFields.length === 0) return;
  writer
    .writeLine(`const bytesFields = ${JSON.stringify(bytesFields)} as const;`)
    .writeLine(`for (const field of bytesFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereBytesFilter(record, field, whereClause[field])) return null;`);
    });
}

function addDateTimeFiltering(writer: CodeBlockWriter, model: Model) {
  const dateTimeFields = model.fields
    .filter((field) => field.type === "DateTime" && !field.isList)
    .map(({ name }) => name);

  if (dateTimeFields.length === 0) return;
  writer
    .writeLine(`const dateTimeFields = ${JSON.stringify(dateTimeFields)} as const;`)
    .writeLine(`for (const field of dateTimeFields)`)
    .block(() => {
      writer.writeLine(`if (!IDBUtils.whereDateTimeFilter(record, field, whereClause[field])) return null;`);
    });
}

function addRelationFiltering(writer: CodeBlockWriter, model: Model, models: readonly Model[]) {
  const relationFields = model.fields.filter(({ kind }) => kind === "object");
  const allFields = models.flatMap(({ fields }) => fields);

  relationFields.forEach((field) => {
    const otherField = allFields.find((_field) => _field.relationName === field.relationName && field !== _field)!;
    if (!field.isList) {
      if (field.relationFromFields?.length) {
        addOneToOneMetaOnFieldFiltering(writer, field);
      } else {
        addOneToOneMetaOnOtherFieldFiltering(writer, field, otherField);
      }
    } else {
      addOneToManyFiltering(writer, field, otherField);
    }
  });
}

function addOneToOneMetaOnFieldFiltering(writer: CodeBlockWriter, field: Field) {
  const fkName = field.relationFromFields?.at(0);
  const relationPk = field.relationToFields?.at(0);

  if (!field.isRequired) {
    writer.writeLine(`if (whereClause.${field.name} === null)`).block(() => {
      writer.writeLine(`if (record.${fkName} !== null) return null;`);
    });
  }

  writer.writeLine(`if (whereClause.${field.name})`).block(() => {
    writer
      .writeLine(`const relationWhereClause = whereClause.${field.name}.is`)
      .writeLine(`? { ...whereClause.${field.name}.is, ${relationPk}: record.${fkName}! }`)
      .writeLine(`: whereClause.${field.name}.isNot`)
      .writeLine(`? { ...whereClause.${field.name}.isNot, ${relationPk}: record.${fkName}! }`)
      .writeLine(`: { ...whereClause.${field.name}, ${relationPk}: record.${fkName}! }`);

    writer
      .writeLine(
        `const relatedRecord = await this.client.${toCamelCase(field.type)}.findFirst({ where: relationWhereClause }, tx);`,
      )
      .writeLine(
        `if ((whereClause.${field.name}.is && !relatedRecord) || (whereClause.${field.name}.isNot && relatedRecord))`,
      )
      .block(() => {
        writer.writeLine(`return null;`);
      });
  });
}

function addOneToOneMetaOnOtherFieldFiltering(writer: CodeBlockWriter, field: Field, otherField: Field) {
  const fkName = otherField.relationFromFields?.at(0);
  const relationPk = otherField.relationToFields?.at(0);

  writer.writeLine(`if (whereClause.${field.name})`).block(() => {
    writer
      .writeLine(`const relationWhereClause = whereClause.${field.name}.is`)
      .writeLine(`? { ...whereClause.${field.name}.is, ${fkName}: record.${relationPk} }`)
      .writeLine(`: whereClause.${field.name}.isNot`)
      .writeLine(`? { ...whereClause.${field.name}.isNot, ${fkName}: record.${relationPk} }`)
      .writeLine(`: { ...whereClause.${field.name}, ${fkName}: record.${relationPk} }`);

    writer
      .writeLine(
        `const relatedRecord = await this.client.${toCamelCase(field.type)}.findFirst({ where: relationWhereClause }, tx);`,
      )
      .writeLine(
        `if ((whereClause.${field.name}.is && !relatedRecord) || (whereClause.${field.name}.isNot && relatedRecord) || relatedRecord === null)`,
      )
      .block(() => {
        writer.writeLine(`return null;`);
      });
  });
}

function addOneToManyFiltering(writer: CodeBlockWriter, field: Field, otherField: Field) {
  // TODO
}
