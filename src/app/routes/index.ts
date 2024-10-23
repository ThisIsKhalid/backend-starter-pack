import express from "express";

import { AuthRoutes } from "../modules/Auth/auth.routes";

import { AdminRoutes } from "../modules/Admin/admin.route";
import { bankAccountRoutes } from "../modules/BankAccount/bankAccount.route";
import { cardRoutes } from "../modules/BankCard/card.route";
import { chatRoutes } from "../modules/Chat/chat.route";
import { contactUsRoutes } from "../modules/ContactUs/contactus.route";
import { customerRoutes } from "../modules/Customer/customer.routes";
import { helperRoutes } from "../modules/Helper/helper.routes";
import { orderRoutes } from "../modules/Order/order.route";
import { OrderFreeVisitRoutes } from "../modules/OrderFreeVisit/orderFreeVisit.route";
import { paymentRoutes } from "../modules/Payment/payment.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/chatroom",
    route: chatRoutes,
  },
  {
    path: "/orders",
    route: orderRoutes,
  },
  {
    path: "/orders/free-visit",
    route: OrderFreeVisitRoutes,
  },
  {
    path: "/helper",
    route: helperRoutes,
  },
  {
    path: "/customer",
    route: customerRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/contactus",
    route: contactUsRoutes,
  },
  {
    path: "/bankaccount",
    route: bankAccountRoutes,
  },
  {
    path: "/card",
    route: cardRoutes,
  },
  {
    path: "/chats",
    route: chatRoutes,
  },
  {
    path: "/stripe",
    route: paymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
