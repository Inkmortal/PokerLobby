impl :: bincode :: Encode for DonkSizeOptions
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    { :: bincode :: Encode :: encode(&self.donk, encoder) ?; Ok(()) }
}