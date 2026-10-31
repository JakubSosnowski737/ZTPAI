const { z } = require("zod");

const buildingIdParams = z.object({
  id: z.coerce.number().int().positive()
});

const createBuildingBody = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(3).max(200)
}).strict();

const updateBuildingBody = createBuildingBody.partial().refine(body => Object.keys(body).length > 0, {
  message: "At least one field is required"
});

module.exports = { buildingIdParams, createBuildingBody, updateBuildingBody };
