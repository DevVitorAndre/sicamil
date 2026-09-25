import { pool } from "./config/database.js";


try {

    const resultado = await pool.query(
        `
        SELECT
            current_database() AS database,
            current_user AS usuario,
            NOW() AS horario
        `
    );


    console.log("");
    console.log("==============================");
    console.log(" TESTE POSTGRESQL - SICAMIL");
    console.log("==============================");

    console.log(
        "Banco:",
        resultado.rows[0].database
    );

    console.log(
        "Usuário:",
        resultado.rows[0].usuario
    );

    console.log(
        "Horário:",
        resultado.rows[0].horario
    );

    console.log("");
    console.log("CONEXÃO REALIZADA COM SUCESSO ✅");
    console.log("");


} catch (erro) {

    console.error("");
    console.error("==============================");
    console.error(" ERRO DE CONEXÃO");
    console.error("==============================");

    console.error(
        "Código:",
        erro.code
    );

    console.error(
        "Mensagem:",
        erro.message
    );

    console.error("");

} finally {

    await pool.end();

}