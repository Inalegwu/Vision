import {createPersistenceAdapter} from "signaldb";
import fs from "node:fs";
import Database from "sqlite3";

export default function createSqlitePersister(databaseName:string){
	return createPersistenceAdapter({
		async register(onChange){
			const exists=await fs.promises.access(databaseName).then(()=>true).catch(()=>false);

if(!exists) new Database(databaseName);

fs.watch(databaseName,undefined,()=>{
	void onChange();
})

		},
		async load(){
			const items={};
			return {items}
		},
		async save(items){}
	})
}