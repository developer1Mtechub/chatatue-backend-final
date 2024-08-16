const express = require("express");
const router = express.Router();
const userRoutes = require("./users/userRoutes");
const policyRoutes = require("./policyRoutes");
const categoryRoutes = require("./categoryRoutes");
const subCategoryRoutes = require("./subCategoryRoutes");
const experienceLevelRoutes = require("./experienceLevelRoutes");
const fitnessGoalRoutes = require("./fitnessGoalRoutes");
const socialLinkRoutes = require("./socialLinkRoutes");
const socialPreferenceRoutes = require("./socialPreferenceRoutes");
const timeRoutes = require("./timeRoutes");
const clubRoutes = require("./club/clubRoutes");
const routeRoutes = require("./club/routeRoutes");
const clubGoalsRoutes = require("./club/club_f_g_Routes");
const clubRulesRoutes = require("./club/clubRulesRoutes");
const membershipRoutes = require("./club/membershipRoutes");
const postsRoutes = require("./club/postsRoutes");
const highlightRoutes = require("./club/highlightsRoutes");
const eventRoutes = require("./event/eventRoutes");
const activitiesRoutes = require("./event/activitiesRoutes");
const meetingPointsRoutes = require("./event/meetingPointRoutes");
const paymentRoutes = require("./payment/paymentRoutes");
const connectedAccountRoutes = require("./payment/connectedAccountRoutes");
const badgesRoutes = require("./badgesRoutes");
const productRoutes = require("./club/productRoutes");
const reviewRoutes = require("./reviews/reviewRoutes");
const suggestionRoutes = require("./suggestionRoutes");
const notificationRoutes = require("./notifications/notificationRoutes");
const contactQueriesRoutes = require("./contactRoutes");
const faqRoutes = require("./faqRoutes");
const scheduleRoutes = require("./club/scheduleRoutes");
const reportRoutes = require("./users/reportRoutes");

// use routes
router.use("/users", userRoutes);

router.use("/category", categoryRoutes);

router.use("/policy", policyRoutes);

router.use("/sub-category", subCategoryRoutes);

router.use("/experience-level", experienceLevelRoutes);

router.use("/fitness-goal", fitnessGoalRoutes);

router.use("/social-link", socialLinkRoutes);

router.use("/social-preference", socialPreferenceRoutes);

router.use("/running-time", timeRoutes);

router.use("/clubs", clubRoutes);

router.use("/routes", routeRoutes);

router.use("/club-goals", clubGoalsRoutes);

router.use("/club-rules", clubRulesRoutes);

router.use("/membership", membershipRoutes);

router.use("/posts", postsRoutes);

router.use("/highlights", highlightRoutes);

router.use("/events", eventRoutes);

router.use("/event-activities", activitiesRoutes);

router.use("/meeting-points", meetingPointsRoutes);

router.use("/payments", paymentRoutes);

router.use("/connected-accounts", connectedAccountRoutes);

router.use("/badges", badgesRoutes);

router.use("/products", productRoutes);

router.use("/reviews", reviewRoutes);

router.use("/suggestions", suggestionRoutes);

router.use("/notifications", notificationRoutes);

router.use("/contact-queries", contactQueriesRoutes);

router.use("/faq", faqRoutes);

router.use("/schedule", scheduleRoutes);

router.use("/reports", reportRoutes);

module.exports = router;
