import * as apartmentService from "../services/apartment.service.js";
export const create = async (req, res) => {
    try {
        const data = await apartmentService.createApartmentService(req.body);
        res.status(201).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getAll = async (req, res) => {
    const { building_id, search, page, limit } = req.query;
    const result = await apartmentService.getAllApartmentsService({
        building_id: building_id ? Number(building_id) : undefined,
        search: search,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
    });
    res.json(result);
};
export const getById = async (req, res) => {
    const data = await apartmentService.getApartmentByIdService(Number(req.params.id));
    data ? res.json(data) : res.status(404).json({ message: "Not found" });
};
export const update = async (req, res) => {
    const data = await apartmentService.updateApartmentService(Number(req.params.id), req.body);
    res.json(data);
};
export const remove = async (req, res) => {
    await apartmentService.deleteApartmentService(Number(req.params.id));
    res.json({ message: "Deleted" });
};
