import {sqliteTable,text,integer,uniqueIndex,blob} from "drizzle-orm/sqlite-core";
import {relations} from "drizzle-orm";

export const issues=sqliteTable("issues",{
    id:text("id").unique().notNull(),
    title:text("title"),
    dateCreated:integer("date-created",{
        mode:"timestamp"
    })
},(table)=>({
    issueIdIndex:uniqueIndex("issue-id-index").on(table.id),
}));

export const attachments=sqliteTable("attachments",{
    id:text("id").unique().notNull(),
    name:text("name"),
    blob:blob("blob"),
    issueId:text("issue-id").references(()=>issues.id),
},(table)=>({
    attachmentIdIndex:uniqueIndex("attachment-id-index").on(table.id),
}))

export const issueToAttachmentRelation=relations(issues,({many})=>({
    attachments:many(attachments)
}))

export const attachmentToIssueRelation=relations(attachments,({one})=>({
    issue:one(issues,{
        fields:[attachments.issueId],
        references:[issues.id],
    }),
}))

