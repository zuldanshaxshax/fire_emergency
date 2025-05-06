import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number (must be in E.164 format: +1234567890)
 * @param {string} body - SMS message body
 * @returns {Promise} - Twilio message response
 */
export const sendSMS = async (to, body) => {
  try {
    const formattedPhone = to.startsWith("+")
      ? to
      : `+252${to.replace(/^0/, "")}`;

    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(
      `SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`
    );
    return message;
  } catch (error) {
    if (
      error.code === 21211 || // Invalid 'To' phone number
      error.code === 21608 // Unverified number for trial account
    ) {
      console.warn(`Skipping unverified or invalid number: ${to}`);
      return null; // Allow app to continue without crashing
    }

    // Rethrow other unknown errors
    console.error("Error sending SMS:", error.message);
    throw error;
  }
};

/**
 * Send emergency assignment notification to staff
 * @param {Object} staff - Staff user object
 * @param {Object} emergency - Emergency object
 * @param {Object} client - Client object
 */
export const notifyStaffAssignment = async (staff, emergency, client) => {
  const message = `Degdeg: Fadlan macaamilkaan usoo adeeg sida ugu dhaqsiyaha badan 
  : ${client.name}
Address: ${emergency.address || "Address not provided"}
Level: ${emergency.level}
faahfaahin: ${emergency.description || "No description provided"}`;

  return sendSMS(staff.phone, message);
};

/**
 * Send emergency assignment notification to client
 * @param {Object} client - Client object
 * @param {Object} staff - Staff user object
 * @param {Object} emergency - Emergency object
 */
export const notifyClientAssignment = async (client, staff, emergency) => {
  const message = `macmiilkaan waxaa kuu shaqayn doona  ${staff.name}.
waxaadna kala xiriiri kartaa: ${staff.phone}`;

  return sendSMS(client.phone, message);
};
