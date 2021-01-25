let toDD = function(val){
    return (val < 10 ? "0": "") + val.toString()
  }
  
var now_chnstr = function(){
let d = new Date();
let yyyy = d.getFullYear();
let mm = d.getMonth() + 1;
let dd = d.getDate();
let hh = d.getHours();
let mi = d.getMinutes();
let ss = d.getSeconds();
let rst = yyyy.toString() + "-"
    + toDD(mm) + "-"
    + toDD(dd) + " "
    + toDD(hh) + ":"
    + toDD(mi) + ":"
    + toDD(ss);
return rst;
}
firstUpper = (val) => {
    if (val == null) {
    return "";
    }
    var f = val.substr(0, 1).toUpperCase();
    return f + val.substring(1, val.length);
}
underlineToCamelCase = function(val) {
    var parts = val.split("_");
    var CamelCase = "";
    for (var i = 0, max = parts.length; i < max; i++) {
      CamelCase += firstUpper(parts[i]);
    }
    return CamelCase.substr(0, 1).toLocaleLowerCase() + CamelCase.substring(1, CamelCase.length);
}
firstLower = (val) =>{
    if (val == null) {
    return "";
    }
    var f = val.substr(0, 1).toLowerCase();
    return f + val.substring(1, val.length);
}

var tablename2ClassName = function(tablename) {
    let parts = tablename.split("\_");
    let className = "";
    parts.forEach(part => {
        className += firstUpper(part);
    });
    return className;
}
const commentStartWiths = "COMMENT '"
const typeMap = {
    "INT": "Integer",
    "VARCHAR": "String",
    "CHAR": "String",
    "DATE": "Date",
    "BIT": "Boolean",
    "FLOAT": "Float",
    "DOUBLE": "Double",
    "DECIMAL": "BigDecimal",
    "TIME": "Date",
    "TIMESTAMP": "Date",
    "JSON": "String",
    "ENUM": "String",
    "TEXT": "String",
    "LONGTEXT": "String",
    "TINYINT": "Boolean",
    "BIGINT": "Long"
}
isAutoIncrement = line=>{
    return line.trim().indexOf("AUTO_INCREMENT") > -1
}
getFieldProperty = (line, keyColName)=>{
    line = line.trim()
    let nameStart = line.indexOf("`")
    let nameEnd = line.indexOf("`", nameStart + 1)
    let commentStart = line.indexOf(commentStartWiths)
    let commentEnd = line.indexOf("'", commentStart + commentStartWiths.length)
    let colName = ""
    let cmtText = ""
    let colType = ""
    let mapType = ""
    let typeStart = nameEnd + 2
    let typeEnd1 = line.indexOf(" ", typeStart + 1)
    let typeEnd2 = line.indexOf("(", typeStart + 1)
    let typeEnd = (typeEnd1 < typeEnd2 || typeEnd2 == -1)? typeEnd1 : typeEnd2
    if(nameStart == 0 && nameEnd > nameStart){
        colName = line.substring(nameStart + 1, nameEnd);
    }
    if(commentStart > 0 && commentEnd > commentStart){
        cmtText = line.substring(commentStart + commentStartWiths.length, commentEnd)
    }
    if(typeStart > 1 && typeEnd > typeStart){
        colType = line.substring(typeStart, typeEnd)
        mapType = typeMap[colType]
    }
    return {entityField: underlineToCamelCase(colName) ,name: colName, paramName: colName.replace("_", "").toLowerCase(), isPrimaryKey: keyColName == colName, commet: cmtText, colType: colType, mapType: mapType, autoIncrement: isAutoIncrement(line)}
}
getFields = (lines, keyColName) =>{
    let fields = []
    let primaryField
    let hasDate = false
    for(let i = 0, max = lines.length; i < max; i++){
        if(isField(lines[i])){
            let fieldProperty = getFieldProperty(lines[i], keyColName);
            if(fieldProperty.isPrimaryKey){
                primaryField = fieldProperty
            }
            if(fieldProperty.mapType == 'Date') hasDate = true
            fields.push(fieldProperty)
        }
    }
    return {fields: fields, primaryField: primaryField, hasDate: hasDate}    
}
isField = (line)=>{
    line = line.trim()
    if(line.indexOf('INT') > -1
    || line.indexOf("VARCHAR") > -1
    || line.indexOf('TEXT') > -1
    || line.indexOf('CHAR(') > -1
    || line.indexOf('DATE') > -1
    || line.indexOf('BIT') > -1
    || line.indexOf('FLOAT') > -1
    || line.indexOf('DOUBLE') > -1
    || line.indexOf('DECIMAL') > -1
    || line.indexOf('JSON') > -1
    || line.indexOf('TIME') > -1
    || line.indexOf('ENUM') > -1
    || line.indexOf('BIGINT') > -1
    ){
        return true
    }else{
        return false
    }
}
isPrimaryKey = (line) =>{
    line = line.trim()
    if(line.indexOf('PRIMARY KEY') > -1){
        return true
    }else{
        return false
    }
}
getPrimaryKeyName = (lines)=>{
    let keyName = ""
    for(let i = 0, max = lines.length; i < max; i ++){
        line = lines[i].trim()
        if(isPrimaryKey(line)){
            let keyStart = line.indexOf('`')
            let keyEnd = line.indexOf('`', keyStart + 1)
            keyName = line.substring(keyStart + 1, keyEnd)
            break;
        }
    }
    return keyName
}
getTableName = lines =>{
    let tableName = ""
    const createString = "CREATE TABLE `"
    for(let i = 0, max = lines.length; i < max; i++){
        let line = lines[i].trim()
        if(line.indexOf(createString) > -1){
            let createStart = line.indexOf(createString) + createString.length
            let createEnd = line.indexOf("`", createStart)
            tableName = line.substring(createStart, createEnd)
            break
        }
    }
    return tableName
}
getTableComment = lines =>{
    let tableComment = ""
    const CMTSTR = "COMMENT='"
    for(let i = 0, max = lines.length; i < max; i++){
        let line = lines[i].trim()
        let cmtStart = line.indexOf(CMTSTR)
        if(cmtStart > -1){
            cmtStart += CMTSTR.length
            let cmtEnd = line.indexOf("'", cmtStart)
            tableComment = line.substring(cmtStart, cmtEnd)
            break
        }
    }
    return tableComment
}

genFiledsForRepository = (fieldsProperty, instanceName)=>{
    let insertFieldNames = []
    let selectFieldNames = []
    let updateFieldNameParams = []
    let insertFieldParams = []
    let updateParamsPut = []
    let insertParamsPut = []
    let updateWhere = '';
    for(let i = 0, max = fieldsProperty.fields.length; i < max; i++){
        let fp = fieldsProperty.fields[i]
        selectFieldNames.push(fp.name)
        insertFieldNames.push(fp.name)
        insertFieldParams.push(`:${fp.paramName}`)
        if(!fp.isPrimaryKey){
            updateFieldNameParams.push(`${fp.name}=:${fp.paramName}`)
        }else{
            updateWhere = `WHERE ${fp.name}=:${fp.paramName}`
        }
        insertParamsPut.push(`paramMap.addValue("${fp.paramName}", ${instanceName}Entity.${fp.entityField}`)
        updateParamsPut.push(`paramMap.addValue("${fp.paramName}", ${instanceName}Entity.${fp.entityField}`)
    }
    return {
        insertFieldNames: insertFieldNames.join(", "),
        selectFieldNames: selectFieldNames.join(", "),
        updateFieldNameParams: updateFieldNameParams.join(", "),
        insertFieldParams: insertFieldParams.join(", "),
        updateWhere: updateWhere,
        updateParamsPut: updateParamsPut.join("\n        "),
        insertParamsPut: insertParamsPut.join("\n        ")
    }
}
genField = (field) => {
    let fieldStr = `
    /**
     * ${field.name}
     * ${field.commet}
    */
    private ${field.mapType} ${field.entityField};
    `
    return fieldStr
}
genFieldsBlock = (fieldsProperty) =>{

    let fieldsBlock = ""
    fieldsProperty.forEach(fieldProperty=>{
        fieldsBlock += genField(fieldProperty)
    })
    return fieldsBlock
}

genJDBC = (sql, basicInfo)=>{
    let lines = sql.split("\n")
    let tableName = getTableName(lines)
    let tableComment = getTableComment(lines)
    let keyColName = getPrimaryKeyName(lines)
    let fieldsProperty = getFields(lines, keyColName)
    let fieldsBlock = genFieldsBlock(fieldsProperty.fields)
    let today = now_chnstr()
    let table = {
        tableName: tableName,
        tableComment: tableComment,
        className: tablename2ClassName(tableName),
        instanceName: firstLower(tablename2ClassName(tableName)),
        primaryField: fieldsProperty.primaryField,
        fieldsBlock: fieldsBlock
    }
    let fieldForRepository = genFiledsForRepository(fieldsProperty, table.instanceName)
    let importDate = fieldsProperty.hasDate ? 'import java.util.Date;' : ''
    let entityString = `package ${basicInfo.packageBasename}.entity;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;
${importDate}

/**
*  ${table.tableComment}
*  表名 ${table.tableName}
*  @author ${basicInfo.author} ${basicInfo.mail} ${today}
*/

@Data
@NoArgsConstructor
public class ${table.className}Entity implements Serializable {

    private static final long serialVersionUID = 1L;

    ${table.fieldsBlock}
}
`
let addBlock = `
    public int add(${table.className}Entity ${table.instanceName}) {
        String sql = \"INSERT INTO ${table.tableName} (${fieldForRepository.insertFieldNames}) VALUES (${fieldForRepository.insertFieldParams})\";
        MapSqlParameterSource paramMap = new MapSqlParameterSource();
        ${fieldForRepository.insertParamsPut}
        return ${basicInfo.jdbcName}.update(sql, paramMap);
    }
`
let updateBlock = `
    public int update(${table.className}Entity ${table.instanceName}) {
        String sql = \"UPDATE ${table.tableName} SET ${fieldForRepository.updateFieldNameParams} ${fieldForRepository.updateWhere};\";
        MapSqlParameterSource paramMap = new MapSqlParameterSource();
        ${fieldForRepository.updateParamsPut}
        return ${basicInfo.jdbcName}.update(sql, paramMap);
    }
`

const getBlock = `
    public ${table.className}Entity get(${fieldsProperty.primaryField.mapType} ${fieldsProperty.primaryField.entityField}) {
        String sql = \"SELECT ${fieldForRepository.selectFieldNames} FROM ${table.tableName} ${fieldForRepository.updateWhere};\";
        BeanPropertyRowMapper<${table.className}Entity> rowMapper = new BeanPropertyRowMapper<${table.className}Entity>(${table.className}Entity.class);
        MapSqlParameterSource paramMap = new MapSqlParameterSource();
        paramMap.addValue(\"${fieldsProperty.primaryField.paramName}\", ${fieldsProperty.primaryField.entityField});
        List<${table.className}Entity> lst = ${basicInfo.jdbcName}.query(sql, paramMap, rowMapper);
        return lst.size() > 0 ? lst.get(0) : null;
    }
`
const isexistBlock = `
    public Boolean exist(${fieldsProperty.primaryField.mapType} ${fieldsProperty.primaryField.entityField}) {
        String sql = \"SELECT 1 from  ${table.tableName} ${fieldForRepository.updateWhere} LIMIT 1\";
        MapSqlParameterSource paramMap = new MapSqlParameterSource();
        paramMap.addValue(\"${fieldsProperty.primaryField.paramName}\", ${fieldsProperty.primaryField.entityField});
        Integer cnt = ${basicInfo.jdbcName}.queryForObject(sql, paramMap, Integer.class);
        return cnt > 0;
    }
`
let repositoryString = `package net.fenv.gen.reposity;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Repository;

import net.fenv.gen.entity.HrZhongbaoDialyEntity;

/**
 *  表名   ${table.tableName}
 *  表说明 ${table.tableComment}
 *  @author ${basicInfo.author} ${basicInfo.mail} ${today}
 */
@Repository
public class ${table.className}Reposity {
    @Autowired
    private NamedParameterJdbcTemplate ${basicInfo.jdbcName};
    ${addBlock}
    ${updateBlock}
    ${getBlock}
    ${isexistBlock}
}
`
return {entity: entityString, repository: repositoryString}
}
