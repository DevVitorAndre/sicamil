export function formatarData(
    data
) {

    if (!data) {
        return "—";
    }


    const objeto =
        new Date(data);


    if (
        Number.isNaN(
            objeto.getTime()
        )
    ) {

        return "—";

    }


    return objeto.toLocaleDateString(
        "pt-BR"
    );

}


export function formatarDataHora(
    data
) {

    if (!data) {
        return "—";
    }


    const objeto =
        new Date(data);


    if (
        Number.isNaN(
            objeto.getTime()
        )
    ) {

        return "—";

    }


    return objeto.toLocaleString(
        "pt-BR"
    );

}


export function formatarNumero(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "—";

    }


    return Number(valor)
        .toLocaleString(
            "pt-BR"
        );

}