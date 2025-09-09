import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

const WelcomePage = ({ navigation }) => {
    return (
        <SafeAreaView style={tw`flex-1 bg-slate-800`} edges={['top', 'left', 'right']}>
            {/* Header with Attendance text */}
            <View style={tw`flex-row justify-center pt-4 pb-8 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                <Text style={[tw`text-white text-lg font-medium`, { fontFamily: 'MarckScript_400Regular' }]}>Attendance</Text>
            </View>

            {/* Main content container */}
            <View style={tw`flex-1 justify-center items-center px-8`}>

                {/* Main title with stylized text */}
                <View style={tw`mb-16`}>
                    <Text style={[tw`text-white text-5xl text-center mb-2`, { fontFamily: 'MarckScript_400Regular' }]}>
                        <Text style={tw`italic`}>Yesssss</Text>
                        <Text style={tw`ml-2`}> Sir!</Text>
                    </Text>
                </View>

                {/* Subtitle */}
                <View style={tw`mb-20 px-4`}>
                    <Text style={[tw`text-gray-300 text-base text-center leading-6`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Effortlessly manage class attendance with our{'\n'}
                        intuitive app
                    </Text>
                </View>

                {/* Get Started Button */}
                <TouchableOpacity
                    style={tw`bg-cyan-400 px-12 py-4 rounded-lg shadow-lg`}
                    onPress={() => {
                        // Navigate to sign up screen
                        navigation.navigate('SignUp');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[tw`text-slate-800 text-lg font-semibold`, { fontFamily: 'MarckScript_400Regular' }]}>
                        Get Started
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Bottom spacing */}
            <View style={tw`h-16`} />

        </SafeAreaView>
    );
};

export default WelcomePage;
