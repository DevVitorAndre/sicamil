import { api } from "./api.js";

import { CONFIG } from "../config.js";

import { Dashboard } from "../models/Dashboard.js";


class DashboardService {

    async buscar() {

        const resposta =
            await api.get(
                CONFIG.ROTAS.dashboard
            );


        return new Dashboard(
            resposta
        );

    }

}


export const dashboardService =
    new DashboardService();