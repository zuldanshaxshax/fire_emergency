import sequelize from "./db.js";
import {
  Admin,
  Customer,
  Expert,
  ServiceType,
  RepairRequest,
  ServiceImage,
  Bid,
  ServiceOrder,
  Payment,
  Payout,
  RefundRequest,
  Rating,
} from "../models/index.js";

const seedDatabase = async () => {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log("Database connected successfully!");

    // Clear existing data (optional, for development only)
    await sequelize.sync({ force: true });

    // Seed Service Types
    const serviceTypes = await ServiceType.bulkCreate([
      { name: "Plumbing", commission_percent: 10 },
      { name: "Electrical", commission_percent: 15 },
      { name: "Carpentry", commission_percent: 12 },
    ]);

    // Seed Admins
    const admins = await Admin.bulkCreate([
      {
        name: "Admin One",
        email: "admin1@example.com",
        password: "hashed_password1",
      },
      {
        name: "Admin Two",
        email: "admin2@example.com",
        password: "hashed_password2",
      },
    ]);

    // Seed Customers
    const customers = await Customer.bulkCreate([
      {
        name: "John Doe",
        phone: "1234567890",
        address: "123 Main St",
        password_hash: "hashed_password1",
      },
      {
        name: "Jane Smith",
        phone: "0987654321",
        address: "456 Elm St",
        password_hash: "hashed_password2",
      },
    ]);

    // Seed Experts
    const experts = await Expert.bulkCreate([
      {
        full_name: "Expert One",
        email: "expert1@example.com",
        bio: "Experienced plumber",
        password_hash: "hashed_password1",
        service_type_id: serviceTypes[0].service_type_id,
        address: "789 Oak St",
        is_verified: true,
      },
      {
        full_name: "Expert Two",
        email: "expert2@example.com",
        bio: "Skilled electrician",
        password_hash: "hashed_password2",
        service_type_id: serviceTypes[1].service_type_id,
        address: "321 Pine St",
        is_verified: false,
      },
    ]);

    // Seed Repair Requests
    const repairRequests = await RepairRequest.bulkCreate([
      {
        customer_id: customers[0].customer_id,
        description: "Fix leaking pipe",
        location: "123 Main St",
        service_type_id: serviceTypes[0].service_type_id,
        status: "pending",
      },
      {
        customer_id: customers[1].customer_id,
        description: "Repair electrical wiring",
        location: "456 Elm St",
        service_type_id: serviceTypes[1].service_type_id,
        status: "bidding",
      },
    ]);

    // Seed Service Images
    const serviceImages = await ServiceImage.bulkCreate([
      {
        request_id: repairRequests[0].request_id,
        url: "http://example.com/image1.jpg",
      },
      {
        request_id: repairRequests[1].request_id,
        url: "http://example.com/image2.jpg",
      },
    ]);

    // Seed Bids
    const bids = await Bid.bulkCreate([
      {
        request_id: repairRequests[0].request_id,
        expert_id: experts[0].expert_id,
        cost: 100.0,
        deadline: new Date(),
        is_accepted: true,
      },
      {
        request_id: repairRequests[1].request_id,
        expert_id: experts[1].expert_id,
        cost: 200.0,
        deadline: new Date(),
        is_accepted: false,
      },
    ]);

    // Seed Service Orders
    const serviceOrders = await ServiceOrder.bulkCreate([
      {
        request_id: repairRequests[0].request_id,
        customer_id: customers[0].customer_id,
        expert_id: experts[0].expert_id,
        service_type_id: serviceTypes[0].service_type_id,
        accepted_bid_id: bids[0].bid_id,
        base_price: 100.0,
        extra_price: 20.0,
        total_price: 120.0,
        status: "in_progress",
        payment_status: "unpaid",
        deadline: new Date(),
      },
    ]);

    // Seed Payments
    const payments = await Payment.bulkCreate([
      {
        service_order_id: serviceOrders[0].service_order_id,
        customer_id: customers[0].customer_id,
        expert_id: experts[0].expert_id,
        type: "initial",
        reason: "Initial payment",
        amount: 120.0,
        status: "paid",
        paid_at: new Date(),
      },
    ]);

    // Seed Payouts
    const payouts = await Payout.bulkCreate([
      {
        service_order_id: serviceOrders[0].service_order_id,
        expert_id: experts[0].expert_id,
        total_payment: 120.0,
        commission: 10.0,
        net_payout: 108.0, // Calculated manually
        payout_status: "released",
        released_at: new Date(),
      },
    ]);

    // Seed Refund Requests
    const refundRequests = await RefundRequest.bulkCreate([
      {
        service_order_id: serviceOrders[0].service_order_id,
        customer_id: customers[0].customer_id,
        reason: "Service not completed",
        status: "requested",
      },
    ]);

    // Seed Ratings
    const ratings = await Rating.bulkCreate([
      {
        service_order_id: serviceOrders[0].service_order_id,
        expert_id: experts[0].expert_id,
        score: 8,
        feedback: "Good service, but could be faster.",
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
};

export default seedDatabase();
