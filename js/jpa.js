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
genJPA = (sql, basicInfo)=>{

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
        return {name: colName, isPrimaryKey: keyColName == colName, commet: cmtText, colType: colType, mapType: mapType, autoIncrement: isAutoIncrement(line)}
    }
    getFields = (lines, keyColName) =>{
        let fields = []
        let primaryField;
        for(let i = 0, max = lines.length; i < max; i++){
            if(isField(lines[i])){
                let fieldProperty = getFieldProperty(lines[i], keyColName);
                if(fieldProperty.isPrimaryKey){
                    primaryField = fieldProperty
                }
                fields.push(fieldProperty)
            }
        }
        return {fields: fields, primaryField: primaryField}    
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

    genField = (field) => {
        let fieldStr = "    /**\n"
        fieldStr += `    * ${field.commet} \n`
        fieldStr += "    */\n"
        if(field.isPrimaryKey){ fieldStr += "    @Id\n"}
        if(field.autoIncrement){ fieldStr += "    @GeneratedValue\n"}
        fieldStr += `    @ApiModelProperty("${field.commet}")\n`
        fieldStr += `    @Column("${field.name}")\n`
        fieldStr += `    private ${field.mapType} ${field.name};\n`
        return fieldStr
    }
    genFieldsBlock = (fieldsProperty) =>{

        let fieldsBlock = ""
        fieldsProperty.forEach(fieldProperty=>{
            fieldsBlock += genField(fieldProperty)+"\n"
        })
        return fieldsBlock
    }


    firstUpper = (val) => {
        if (val == null) {
        return "";
        }
        var f = val.substr(0, 1).toUpperCase();
        return f + val.substring(1, val.length);
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

    repositoryString = `package ${basicInfo.packageBasename}.reposity;
import ${basicInfo.packageBasename}.${table.className};

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
/**
*  ${table.tableComment}
*  @author ${basicInfo.author} ${basicInfo.mail} ${today}
*/
@Repository
public interface ${table.className}Repository extends JpaRepository<${table.className}, ${table.primaryField.mapType}> {\

}
`

    entityString = `package ${basicInfo.packageBasename}.entity;

import lombok.Data;
import java.util.Date;
import java.util.List;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.GeneratedValue;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
/**
*  ${table.tableComment}
*  @author ${basicInfo.author} ${basicInfo.mail} ${today}
*/
@Entity
@Data
@Table(name=\"${table.tableName}\")
@ApiModel(\"${table.tableComment}\")
public class ${table.className} implements Serializable {

    private static final long serialVersionUID = 1L;

${table.fieldsBlock}
}
`
    serviceString = `package ${basicInfo.packageBasename}.service;
import ${basicInfo.packageBasename}.${table.className};
import ${basicInfo.packageBasename}.${table.className}Repository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

/**
*  ${table.tableComment}
*  @author ${basicInfo.author} ${basicInfo.mail} ${today}
*/
@Service\
public class ${table.className}Service {
    @Autowired\n
    private ${table.className}Repository ${table.instanceName}Repository;
    public Object save(${table.className} entity){
        return ${table.instanceName}Repository.save(entity);
    }
    public Object delete(${table.primaryField.mapType} id}){
        Optional<${table.className}> ${table.instanceName} = ${table.instanceName}Repository.findById(id);
        if(${table.instanceName}.isPresent()){
            ${table.instanceName}Repository.deleteById(id);
            return ApiReturnObject.success("删除成功");
        }else{
            return ApiReturnObject.error("没有找到该对象");
        }
    }
    public Object find(${table.primaryField.mapType} id){
        Optional<${table.className}> ${table.instanceName} = ${table.tableName}Repository.findById(id);
        if(${table.instanceName}.isPresent()){
            return ApiReturnObject.success(${table.instanceName}.get());
        }else{
            return ApiReturnObject.error("没有找到该对象");
        }
    }
    public Object list(${table.className} ${table.instanceName}, int pageNumber, int pageSize) {

        //创建匹配器，需要查询条件请修改此处代码
        ExampleMatcher matcher = ExampleMatcher.matchingAll();

        //创建实例
        Example<${table.className}> example = Example.of(${table.instanceName}, matcher);
        //分页构造
        Pageable pageable = PageRequest.of(pageNumber,pageSize);

        return ${table.instanceName}Repository.findAll(example, pageable);
    }
}
`

    return {entity: entityString, repository: repositoryString, service: serviceString}
}
