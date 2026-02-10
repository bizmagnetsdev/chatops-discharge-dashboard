
export interface OtpRequestDTO {
    name?: string;
    mobileNumber: string;
    countryCode?: string;
    otpUid?: string;
    otp?: string;
    resendSameOTP?: boolean;
}

export interface OtpResponseDTO {
    message: string;
    id?: string; // OTP UID
    status?: string;
}

export interface UserDetailsDTO {
    id: number;
    mobileNumber: string;
    userName: string;
    flowName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserResponseDTO {
    data: UserDetailsDTO;
    status: string;
}

export const authService = {
    async sendOtp(mobileNumber: string): Promise<OtpResponseDTO> {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobileNumber }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to send OTP');
        }

        return response.json();
    },

    async verifyOtp(otpUid: string, otp: string, mobileNumber: string): Promise<OtpResponseDTO> {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                otpUid,
                otp,
                mobileNumber
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to verify OTP');
        }

        return response.json();
    },

    async getUserDetails(mobileNumber: string): Promise<UserResponseDTO> {
        const response = await fetch(`/api/user-details?mobileNumber=${mobileNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to fetch user details');
        }

        return response.json();
    }
};
