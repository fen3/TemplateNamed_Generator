const repositoryTemplate = "package @@packageBasename@@.reposity;\n\
\n\
import org.springframework.beans.factory.annotation.Autowired;\n\
import org.springframework.jdbc.core.BeanPropertyRowMapper;\n\
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate\n\
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;\n\
import org.springframework.stereotype.Repository;\n\
\n\
import @@packageBasename@@.entity.@@entityName@@;\n\
\n\
/**\n\
*  @@classComment@@\n\
*  表名 @@tableName@@\n\
* @author @@author@@ @@createdate@@\n\
*/\n\
\n\
@Repository\n\
public class @@reposityName@@ {\n\
    @Autowired\n\
    private NamedParameterJdbcTemplate jdbcTemplateNamed;\n\
@@addMethod@@\n\
@@updateMethod@@\n\
@@getMethod@@\n\
@@isexistMethod@@\n\
}\n\
"
const addTemplate = "    public int add(@@entityName@@ @@classname@@) {\n\
        String sql = \"INSERT INTO @@tableName@@ (@@ColumnNameComma@@) VALUES (@@ParamNameComma@@)\";\n\
        MapSqlParameterSource paramMap = new MapSqlParameterSource();\n\
@@putblock@@\n\
        return jdbcTemplateNamed.update(sql, paramMap);\n\
    }\n\
"
const updateTemplate = "    public int update(@@entityName@@ @@classname@@) {\n\
        String sql = \"@@updatesql@@\";\n\
        MapSqlParameterSource paramMap = new MapSqlParameterSource();\n\
@@putblock@@\n\
        return jdbcTemplateNamed.update(sql, paramMap);\n\
    }\n\
"

const getTemplate = "\
    public @@entityName@@ get(@@primaryFieldClass@@ @@primaryfield@@) {\n\
        String sql = \"SELECT @@ColumnNameComma@@ FROM @@tableName@@ WHERE  @@primary_column@@=:@@primaryfield@@;\";\n\
        BeanPropertyRowMapper<@@entityName@@> rowMapper = new BeanPropertyRowMapper<@@entityName@@>(@@entityName@@.class);\n\
        MapSqlParameterSource paramMap = new MapSqlParameterSource();\n\
        paramMap.addValue(\"@@primary_column@@\",@@primaryfield@@);\n\
        List<@@entityName@@> lst = jdbcTemplateNamed.query(sql, paramMap, rowMapper);\n\
        return lst.size() > 0 ? lst.get(0) : null;\n\
    }\n\
"
const isexistTemplate = "\
    public Boolean exist(@@entityName@@ @@classname@@) {\n\
        String sql = \"SELECT COUNT(0) from @@tableName@@ WHERE @@primary_column@@=:@@primaryfield@@\";\n\
        MapSqlParameterSource paramMap = new MapSqlParameterSource();\n\
        paramMap.addValue(\"@@primary_column@@\", @@classname@@.get@@primaryFieldName@@());\n\
        Integer cnt = jdbcTemplateNamed.queryForObject(sql, paramMap, Integer.class);\n\
        return cnt > 0;\n\
    }\n\
"

const classTemplate = "package  net.fenv.rest.entity;\n\
    \n\
import java.io.Serializable;\n\
import lombok.Data;\n\
import lombok.NoArgsConstructor;@@importdate@@\n\
\n\
/**\n\
*  @@classComment@@\n\
*  表名 @@tableName@@\n\
*  @author @@author@@ @@createdate@@\n\
*/\n\
\n\
@Data\n\
@NoArgsConstructor\n\
public class @@entityName@@ implements Serializable {\n\
    \n\
    private static final long serialVersionUID = 1L;\n\
    @@fieldsBlock@@\n\
}\n\
"
const fieldTemplate = "\n\
    /**\n\
    * @@fieldComment@@\n\
    * 字段 @@columnName@@\n\
    */\n\
    private @@fieldClass@@ @@fieldName@@;\n\
    "
