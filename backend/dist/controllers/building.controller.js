import * as buildingService from "../services/building.service.js";
export const create = async (req, res) => {
    try {
        const { address_old, address_new, description, status, total_floors, branch_name, manager_id } = req.body;
        if (!address_old || !address_new || !total_floors || !branch_name) {
            res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
            return;
        }
        const data = await buildingService.createBuildingService({
            address_old,
            address_new,
            description,
            status: status ? status : "ACTIVE",
            total_floors: Number(total_floors),
            branch_name,
            manager: manager_id ? { connect: { id: Number(manager_id) } } : undefined
        });
        res.status(201).json({
            ...data,
            name: data.branch_name
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getAll = async (req, res) => {
    const { search, branch_name, page, limit, managerId } = req.query;
    const result = await buildingService.getAllBuildingsService({
        search: search,
        branch_name: branch_name,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        managerId: managerId ? Number(managerId) : undefined
    });
    res.json({
        ...result,
        data: result.data.map(b => ({
            ...b,
            name: b.branch_name
        }))
    });
};
export const getById = async (req, res) => {
    const data = await buildingService.getBuildingByIdService(Number(req.params.id));
    if (data) {
        res.json({
            ...data,
            name: data.branch_name
        });
    }
    else {
        res.status(404).json({ message: "Not found" });
    }
};
export const update = async (req, res) => {
    const { name, manager_id, ...updateData } = req.body;
    const prismaUpdateData = {
        ...updateData
    };
    if (manager_id !== undefined) {
        prismaUpdateData.manager = manager_id ? { connect: { id: Number(manager_id) } } : { disconnect: true };
    }
    const data = await buildingService.updateBuildingService(Number(req.params.id), prismaUpdateData);
    res.json({
        ...data,
        name: data.branch_name
    });
};
export const remove = async (req, res) => {
    await buildingService.deleteBuildingService(Number(req.params.id));
    res.json({ message: "Deleted" });
};
