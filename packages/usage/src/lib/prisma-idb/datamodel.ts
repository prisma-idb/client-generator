import type { DMMF } from "@prisma/client/runtime/library";

export const User: DMMF.Datamodel["models"][number] = {
    name: "User",
    dbName: null,
    fields: [
      {
        name: "id",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        isReadOnly: false,
        hasDefaultValue: true,
        type: "String",
        default: { name: "cuid", args: [] },
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "name",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "String",
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "assignedTodos",
        kind: "object",
        isList: true,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "Todo",
        relationName: "TodoToUser",
        relationFromFields: [],
        relationToFields: [],
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    primaryKey: null,
    uniqueFields: [],
    uniqueIndexes: [],
    isGenerated: false,
  },
  Todo: DMMF.Datamodel["models"][number] = {
    name: "Todo",
    dbName: null,
    fields: [
      {
        name: "id",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        isReadOnly: false,
        hasDefaultValue: true,
        type: "String",
        default: { name: "cuid", args: [] },
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "task",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "String",
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "isCompleted",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "Boolean",
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "timeToComplete",
        kind: "scalar",
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "Int",
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "assignedUser",
        kind: "object",
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        hasDefaultValue: false,
        type: "User",
        relationName: "TodoToUser",
        relationFromFields: ["assignedUserId"],
        relationToFields: ["id"],
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: "assignedUserId",
        kind: "scalar",
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        isReadOnly: true,
        hasDefaultValue: false,
        type: "String",
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    primaryKey: null,
    uniqueFields: [],
    uniqueIndexes: [],
    isGenerated: false,
  };