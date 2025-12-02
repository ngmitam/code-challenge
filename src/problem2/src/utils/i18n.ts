import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
	en: {
		translation: {
			currencySwap: "Currency Swap",
			from: "From",
			to: "To",
			swapFrom: "swap from",
			receive: "receive",
			amountToSend: "Amount to send",
			amountToReceive: "Amount to receive",
			confirmSwap: "CONFIRM SWAP",
			processing: "Processing...",
			swapSuccessful: "Swap Successful!",
			swapCompleted:
				"Your currency swap has been completed successfully.",
			unableToLoad: "Unable to load currency data",
			tryAgain: "Try Again",
			toggleTheme: "Toggle theme",
			failedToLoad:
				"Failed to load prices. Please check your connection and try again.",
			amountRequired: "Amount is required",
			invalidNumber: "Must be a valid number",
			amountGreaterThanZero: "Amount must be greater than 0",
			amountTooLarge: "Amount cannot exceed 1,000,000",
			currencyRequired: "Currency is required",
			selectCurrency: "Please select a currency",
			targetCurrencyRequired: "Target currency is required",
			currenciesMustBeDifferent:
				"From and to currencies must be different",
		},
	},
	vi: {
		translation: {
			currencySwap: "Trao đổi Tiền tệ",
			from: "Từ",
			to: "Đến",
			swapFrom: "trao đổi từ",
			receive: "nhận",
			amountToSend: "Số tiền gửi",
			amountToReceive: "Số tiền nhận",
			confirmSwap: "XÁC NHẬN TRAO ĐỔI",
			processing: "Đang xử lý...",
			swapSuccessful: "Trao đổi thành công!",
			swapCompleted:
				"Giao dịch trao đổi tiền tệ của bạn đã hoàn tất thành công.",
			unableToLoad: "Không thể tải dữ liệu tiền tệ",
			tryAgain: "Thử lại",
			toggleTheme: "Chuyển đổi chủ đề",
			failedToLoad:
				"Không thể tải giá. Vui lòng kiểm tra kết nối và thử lại.",
			amountRequired: "Cần nhập số tiền",
			invalidNumber: "Phải là số hợp lệ",
			amountGreaterThanZero: "Số tiền phải lớn hơn 0",
			amountTooLarge: "Số tiền không được vượt quá 1,000,000",
			currencyRequired: "Cần chọn tiền tệ",
			selectCurrency: "Vui lòng chọn tiền tệ",
			targetCurrencyRequired: "Cần chọn tiền tệ đích",
			currenciesMustBeDifferent: "Tiền tệ nguồn và đích phải khác nhau",
		},
	},
};

i18n.use(initReactI18next).init({
	resources,
	lng: "en", // default language
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
