import { gql } from 'graphql-tag';

export const getSteamProfile = gql`
  query GetSteamProfile($steamId: String!) {
    getSteamProfile(steamId: $steamId) {
      steamId
      personaName
      profileUrl
      avatar
      avatarMedium
      avatarFull
      personState
      communityVisibilityState
      profileState
      lastLogoff
      commentPermission
      realName
      primaryClanId
      timeCreated
      gameId
      gameServerIp
      gameExtraInfo
      cityId
      locCountryCode
      locStateCode
      locCityId
    }
  }
`;

export const getSteamGames = gql`
  query GetSteamGames($steamId: String!) {
    getSteamGames(steamId: $steamId) {
      gameCount
      games {
        appId
        name
        playtimeTotal
        playtimeRecent
        iconUrl
        logoUrl
        hasStats
        lastPlayed
        playtimeWindows
        playtimeMac
        playtimeLinux
      }
    }
  }
`;

export const getSteamAchievements = gql`
  query GetSteamAchievements($steamId: String!, $appId: String!) {
    getSteamAchievements(steamId: $steamId, appId: $appId) {
      steamId
      gameName
      achievements {
        apiName
        achieved
        unlockTime
        name
        description
      }
    }
  }
`;

export const connectSteamProfile = gql`
  mutation ConnectSteamProfile($steamId: String!) {
    connectSteamProfile(steamId: $steamId) {
      steamId
      personaName
      profileUrl
      avatar
      avatarMedium
      avatarFull
      personState
      communityVisibilityState
      profileState
      lastLogoff
      commentPermission
      realName
      primaryClanId
      timeCreated
      gameId
      gameServerIp
      gameExtraInfo
      cityId
      locCountryCode
      locStateCode
      locCityId
    }
  }
`;

export const syncSteamLibrary = gql`
  mutation SyncSteamLibrary($steamId: String!) {
    syncSteamLibrary(steamId: $steamId) {
      gameCount
      games {
        appId
        name
        playtimeTotal
        playtimeRecent
        iconUrl
        logoUrl
        hasStats
        lastPlayed
        playtimeWindows
        playtimeMac
        playtimeLinux
      }
    }
  }
`;

export const syncSteamAchievements = gql`
  mutation SyncSteamAchievements($steamId: String!, $appId: String!) {
    syncSteamAchievements(steamId: $steamId, appId: $appId) {
      steamId
      gameName
      achievements {
        apiName
        achieved
        unlockTime
        name
        description
      }
    }
  }
`;
