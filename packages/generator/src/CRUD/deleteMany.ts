import { ClassDeclaration } from "ts-morph";

// TODO: handle cascades
// TODO: use indexes wherever possible

export function addDeleteManyMethod(modelClass: ClassDeclaration) {
  modelClass.addMethod({
    name: "deleteMany",
    isAsync: true,
    typeParameters: [{ name: "Q", constraint: 'Prisma.Args<T, "deleteMany">' }],
    parameters: [{ name: "query", type: `Q` }],
    statements: (writer) => {
      writer
        .writeLine(`const records = filterByWhereClause(`)
        .indent(() => {
          writer
            .writeLine(`await this.client.db.getAll(toCamelCase(this.model.name)),`)
            .writeLine(`this.keyPath,`)
            .writeLine(`query?.where,`);
        })
        .writeLine(`)`)
        .writeLine(`if (records.length === 0) return { count: 0 } as Prisma.Result<T, Q, "deleteMany">;`)
        .blankLine()
        .writeLine(`const tx = this.client.db.transaction(toCamelCase(this.model.name), "readwrite");`)
        .writeLine(`await Promise.all([`)
        .indent(() => {
          writer
            .writeLine(`...records.map((record) => `)
            .indent(() => {
              writer.writeLine(`tx.store.delete(this.keyPath.map((keyField) => record[keyField] as IDBValidKey))`);
            })
            .writeLine(`),`)
            .writeLine(`tx.done,`);
        })
        .writeLine(`]);`)
        .writeLine(`this.emit("delete");`)
        .writeLine('return { count: records.length } as Prisma.Result<T, Q, "deleteMany">;');
    },
  });
}
